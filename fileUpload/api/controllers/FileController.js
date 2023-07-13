const csv = require("convert-csv-to-json");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const systemFields = [
  "Given Name",
  "Surname",
  "Email",
  "Phone",
  "Address",
  "Blood Group",
  "Description",
  "Country",
  "Id",
  "Website",
  "Year",
  "Employee No",
  "Date",
  "Gender",
  "Title",
];
module.exports = {
  //file uploading
  fileUpload: async (req, res) => {
    try {
      req.file("file").upload(
        {
          dirname: require("path").resolve(sails.config.appPath, "uploads"),
        },
        async function (err, uploadedFiles) {
          //server error
          if (err) return res.serverError(err);

          //if file empty then through error
          if (uploadedFiles.length === 0) {
            return res.badRequest("No file was uploaded.");
          }
          // file name
          const filedata = uploadedFiles[0].filename;
          const filename = path.parse(filedata).name;
          // file path
          const uploadedFile = uploadedFiles[0];
          const filePath = uploadedFile.fd;
          //file extension
          const file = uploadedFiles[0].filename;
          const extension = path.extname(file);
          //check file data already exists
          const fileUpload = await Fileupload.findOne({ fileName: filename });
          //csv file uploaded
          if (extension === ".csv") {
            //get data in json form
            const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);
            //if file already exist data updated otherwise new data created
            if (fileUpload) {
              try {
                //data update
                const updateFile = await Fileupload.updateOne({
                  fileName: filename,
                }).set({ data: jsonArray });
                return res.send({
                  message: "Data updated successfully!!",
                  updateFile: updateFile,
                });
              } catch (error) {
                return res.serverError(error);
              }
            } else {
              try {
                const createdField = await Fileupload.create({
                  data: jsonArray,
                  fileName: filename,
                }).fetch();
                return res.send({
                  message: "Data Added Successfully!!",
                  fieldNames: createdField,
                });
              } catch (error) {
                return res.serverError(error);
              }
            }
          } else if (extension === ".xlsx") {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            //get xlsx data
            const jsonArray = xlsx.utils.sheet_to_json(worksheet);
            //if file already exist data updated otherwise new data created
            if (fileUpload) {
              try {
                const updateFile = await Fileupload.updateOne({
                  fileName: filename,
                }).set({ data: jsonArray });
                return res.send({
                  message: "Data updated successfully!!",
                  updateFile: updateFile,
                });
              } catch (error) {
                return res.serverError(error);
              }
            } else {
              try {
                const createdField = await Fileupload.create({
                  data: jsonArray,
                  fileName: filename,
                }).fetch();
                return res.json({
                  message: "Data Added Successfully!!",
                  fieldNames: createdField,
                });
              } catch (error) {
                return res.status(400).send({
                  message: "Data Not Added!!",
                });
              }
            }
          } else {
            return res.status(400).send({
              message: "Unsupported File Format",
            });
          }
        }
      );
    } catch (error) {
      return res.status(500).send({
        error: error,
        message: "File Not Uploaded!!",
      });
    }
  },

  //field  mapping
  fileMapping: async (req, res) => {
    try {
      //get main file data
      const fileData = await Fileupload.findOne({ id: Number(req.body.id) });
      //file data not found
      if (!fileData) {
        return res.notFound("Filedata Not Found");
      }
      //get only file field
      const headerRow = Object.keys(fileData.data[0]);
      //get file data in json form
      const jsonArray = fileData.data;
      //get file name
      const filename = fileData.fileName;

      console.log(req.body);
      const validatedArray = await sails.helpers.validation(
        jsonArray.map((item) => {
          const parsedItem = {};

          // map field with specific field
          const fieldMappingsArray = Object.entries(req.body).map(
            ([key, value]) => ({
              key,
              value: systemFields.includes(value)
                ? value
                : headerRow[key] || key,
            })
          );

          Object.entries(item).forEach(([key, value]) => {
            // Find the mapped key from the fieldMappingsArray
            const fieldMapping = fieldMappingsArray.find(
              (field) => field.key === key
            );

            if (fieldMapping) {
              const mappedKey = fieldMapping.value;

              if (!isNaN(value)) {
                // Check if the value is too large to be parsed as an integer
                if (Number(value) > Number.MAX_SAFE_INTEGER) {
                  // Store the value as a string
                  parsedItem[mappedKey] = value.toString();
                } else {
                  parsedItem[mappedKey] = parseInt(value, 10);
                }
              } else {
                // Handle string values with special characters
                parsedItem[mappedKey] =
                  typeof parsedItem[mappedKey] === "string"
                    ? parsedItem[mappedKey].concat(value.replace(/'/g, "''"))
                    : value;
              }
            }
          });

          return parsedItem;
        })
      );
      const tablename = filename;
      const firstObject = validatedArray.validatedArray[0];
      const keys = Object.keys(firstObject);

      //if table already exist then drop table and add a new data to database
      const checkTableQuery = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = '${tablename}'
      )`;
      const checkTableResult = await sails
        .getDatastore()
        .sendNativeQuery(checkTableQuery);

      if (checkTableResult.rows[0].exists) {
        // Table exists, drop the existing table
        const dropTableQuery = `DROP TABLE "${tablename}"`;
        await sails.getDatastore().sendNativeQuery(dropTableQuery);
      }

      //Define type
      const assignType = (value) => {
        if (typeof value === "string") {
          return "VARCHAR(255) DEFAULT NULL";
        } else if (!isNaN(value) && Number.isInteger(parseInt(value))) {
          return "BIGINT DEFAULT NULL";
        } else {
          return "VARCHAR(255) DEFAULT NULL";
        }
      };

      const columns = keys.map((key) => {
        const columnName = headerRow[key] || key;
        return `"${columnName}" ${assignType(firstObject[key])}`;
      });

      const createTableQuery = `CREATE TABLE "${tablename}" (${columns.join(
        ", "
      )})`;

      try {
        //create table using native query
        const rawResult = await sails
          .getDatastore()
          .sendNativeQuery(createTableQuery);

        // Insert values into the created table
        for (const item of validatedArray.validatedArray) {
          const insertValues = keys
            .map((key) => {
              const columnName = headerRow[key] || key;
              if (item[key] === null) {
                return "NULL";
              }
              return `'${item[key]}'`;
            })
            .join(", ");

          const insertValuesQuery = `INSERT INTO "${tablename}" (${keys
            .map((key) => `"${key}"`)
            .join(", ")}) VALUES (${insertValues})`;

          const insertResult = await sails
            .getDatastore()
            .sendNativeQuery(insertValuesQuery);
          console.log("Values inserted successfully:", insertResult);
        }
      } catch (error) {
        console.error("Failed to create table or insert values:", error);
      }

      return res.json({
        data: validatedArray,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
};
