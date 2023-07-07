const csv = require("convert-csv-to-json");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

module.exports = {
  
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

            try {
              const createdField = await Fileupload.create({
                field: headerRow,
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
            try {
              const createdField = await Fileupload.create({
                field: headerRow,
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

  fileProcessing: async (req, res) => {
    try {
      await req.file("file").upload(
        {
          dirname: require("path").resolve(sails.config.appPath, "uploads"),
        },
        async function (err, uploadedFiles) {
          const file = uploadedFiles[0].filename;
          const filename = path.parse(file).name;

          if (err) return res.serverError(err);

          if (uploadedFiles.length === 0) {
            return res.badRequest("No file was uploaded.");
          }

          const uploadedFile = uploadedFiles[0];
          const filePath = uploadedFile.fd;
          //check file extension
          const fileExt = uploadedFiles[0].filename;
          const extension = path.extname(fileExt);
          //CSV File
          if (extension === ".csv") {
            // Read the file using fs.readFileSync
            const buffer = fs.readFileSync(filePath);
            const csvString = buffer.toString();

            // Convert the CSV string to JSON using convert-csv-to-json
            const lines = csvString.split("\n");

            // get file fields
            const headerRow = lines[0].split(",");
            const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);

            //validate function using helper
            const validatedArray = await sails.helpers.validation(
              jsonArray.map((item) => {
                // Convert integer fields to actual numbers
                const parsedItem = Object.entries(item).reduce(
                  (acc, [key, value]) => {
                    if (!isNaN(value) && Number.isInteger(parseFloat(value))) {
                      acc[key] = parseInt(value, 10);
                    } else {
                      acc[key] = value;
                    }
                    return acc;
                  },
                  {}
                );

                return parsedItem;
              })
            );
            console.log(validatedArray);

            //create model
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

            const columns = keys.map(
              (key) => `"${key}" ${assignType(firstObject[key])}`
            );
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
          }
          //XLSX File
          else if (extension === ".xlsx") {
            console.log("xml file");
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Assuming the first sheet is used
            const worksheet = workbook.Sheets[sheetName];
            const excelData = xlsx.utils.sheet_to_json(worksheet, {
              header: 1,
            });

            const headerRow = excelData[0];
            const jsonArray = xlsx.utils.sheet_to_json(worksheet);

            //validate function using helper
            const validatedArray = await sails.helpers.validation(
              jsonArray.map((item) => {
                // Convert integer fields to actual numbers
                const parsedItem = Object.entries(item).reduce(
                  (acc, [key, value]) => {
                    if (!isNaN(value) && Number.isInteger(parseFloat(value))) {
                      acc[key] = parseInt(value, 10);
                    } else {
                      acc[key] = value;
                    }
                    return acc;
                  },
                  {}
                );

                return parsedItem;
              })
            );
            console.log(validatedArray);

            //create model
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

            const columns = keys.map(
              (key) => `"${key}" ${assignType(firstObject[key])}`
            );
            const createTableQuery = `CREATE TABLE "${tablename}" (${columns.join(
              ", "
            )})`;
            console.log(createTableQuery);

            try {
              //create table
              const rawResult = await sails
                .getDatastore()
                .sendNativeQuery(createTableQuery);
              console.log("Table created successfully:", rawResult);

              // Insert values into the created table
              for (const item of validatedArray) {
                const insertValues = keys
                  .map((key) => {
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
          }
          //Invalid File
          else {
            return res.status(400).send({
              message: "Unsupported File Format",
            });
          }
        }
      );
    } catch (error) {
      return res.status(500).send({
        error: error.message,
        message: "File Not Uploaded!!",
      });
    }
  },
};
