const csv = require("convert-csv-to-json");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const systemFields = [
  "Given Name",
  "surname",
  "email",
  "phone",
  "address",
  "Blood Group",
  "Description",
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
          if (err) return res.serverError(err);

          if (uploadedFiles.length === 0) {
            return res.badRequest("No file was uploaded.");
          }
          const filedata = uploadedFiles[0].filename;
          const filename = path.parse(filedata).name;
          console.log(filename);

          const uploadedFile = uploadedFiles[0];
          const filePath = uploadedFile.fd;

          const file = uploadedFiles[0].filename;
          const extension = path.extname(file);
          //csv file uploaded
          if (extension === ".csv") {
            // Read the file using fs.readFileSync
            const buffer = fs.readFileSync(filePath);
            // Convert the buffer to a string
            const csvString = buffer.toString();

            // Extract the header row
            const lines = csvString.split("\n");
            const headerRow = lines[0].split(",");
            const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);
            console.log(jsonArray);
            try {
              const createdField = await Fileupload.create({
                data: jsonArray,
                fileName: filename,
              }).fetch();
              return res.json({
                fieldNames: createdField,
              });
            } catch (error) {
              return res.serverError(error);
            }
          } else if (extension === ".xlsx") {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const excelData = xlsx.utils.sheet_to_json(worksheet, {
              header: 1,
            });

            const headerRow = excelData[0];
            const jsonArray = xlsx.utils.sheet_to_json(worksheet);
            try {
              const createdField = await Fileupload.create({
                data: jsonArray,
                fileName: filename,
              }).fetch();
              return res.json({
                fieldNames: createdField,
              });
            } catch (error) {
              return res.serverError(error);
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
      const fileData = await Fileupload.findOne({ id: Number(req.body.id) });
      // log
      if (!fileData) {
        return res.notFound("Filedata Not Found");
      }
      console.log(fileData);
      const headerRow = Object.keys(fileData.data[0]);
      console.log(headerRow);
      const jsonArray = fileData.data;
      console.log(jsonArray);
      const filename = fileData.fileName;
      console.log(filename);

      const validatedArray = await sails.helpers.validation(
        jsonArray.map((item) => {
          const parsedItem = Object.entries(item).reduce(
            (acc, [key, value]) => {
              //map field with specific field
              const fieldMappingsArray = Object.entries(req.body).map(
                ([key, value]) => ({
                  key,
                  value: systemFields.includes(value)
                    ? value
                    : headerRow[key] || key,
                })
              );
              const mappedKey =
                fieldMappingsArray.find((field) => field.key === key)?.value ||
                key;

              if (!isNaN(value)) {
                // Check if the value is too large to be parsed as an integer
                if (Number(value) > Number.MAX_SAFE_INTEGER) {
                  acc[mappedKey] = value.toString(); // Store the value as a string
                } else {
                  acc[mappedKey] = parseInt(value, 10); // Parse the value as an integer
                }
              } else {
                acc[mappedKey] = value;
              }
              return acc;
            },
            {}
          );
          return parsedItem;
        })
      );

      console.log(validatedArray);
      const tablename = filename;
      const firstObject = validatedArray[0];
      const keys = Object.keys(firstObject);
      const values = Object.values(firstObject);

      //Define type
      const assignType = (value) => {
        if (typeof value === "string") {
          return "VARCHAR(255) DEFAULT NULL";
        } else if (!isNaN(value) && Number.isInteger(parseInt(value))) {
          return "INT DEFAULT NULL";
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
      console.log(createTableQuery);

      try {
        //create table using native query
        const rawResult = await sails
          .getDatastore()
          .sendNativeQuery(createTableQuery);

        console.log("Table created successfully:", rawResult);

        // Insert values into the created table
        for (const item of validatedArray) {
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
