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
  "Industry",
];

module.exports = {
  createTable: async (req, res) => {
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

          //   csv file uploaded
          if (extension === ".csv") {
            const buffer = fs.readFileSync(filePath);
            const csvString = buffer.toString();

            // Extract the header row
            const lines = csvString.split("\n");
            const headerRow = lines[0].split(",");
            console.log(headerRow);
            const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);
            console.log(jsonArray);
            const jsonArrayString = JSON.stringify(jsonArray);
            const createGenericTableQuery = `CREATE TABLE IF NOT EXISTS generic_table (data varchar)`;
            const createGenericTableResult = await sails
              .getDatastore()
              .sendNativeQuery(createGenericTableQuery);

            const insertDataQuery = `INSERT INTO generic_table (data) VALUES ($1)`;
            const insertResult = await sails
              .getDatastore()
              .sendNativeQuery(insertDataQuery, [jsonArrayString]);

            return res.send("data added");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },

  // storeData: async (req, res) => {
  //   try {
  //     req.file("file").upload(
  //       {
  //         dirname: require("path").resolve(sails.config.appPath, "uploads"),
  //       },
  //       async function (err, uploadedFiles) {
  //         //server error
  //         if (err) return res.serverError(err);

  //         //if file empty then through error
  //         if (uploadedFiles.length === 0) {
  //           return res.badRequest("No file was uploaded.");
  //         }
  //         // file name
  //         const filedata = uploadedFiles[0].filename;
  //         const filename = path.parse(filedata).name;
  //         // file path
  //         const uploadedFile = uploadedFiles[0];
  //         const filePath = uploadedFile.fd;
  //         //file extension
  //         const file = uploadedFiles[0].filename;
  //         const extension = path.extname(file);

  //         //   csv file uploaded
  //         if (extension === ".csv") {
  //           const buffer = fs.readFileSync(filePath);
  //           const csvString = buffer.toString();

  //           // Extract the header row
  //           const lines = csvString.split("\n");
  //           const headerRow = lines[0].split(",");
  //           console.log(headerRow);
  //           //get data in json form
  //           const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);
  //           //if file already exist data updated otherwise new data created
  //           console.log(jsonArray);

  //           try {
  //             // const col = headerRow.map((columnName) =>
  //             //   columnName.replace(" ", "_").trim()
  //             // );

  //             const col = headerRow.map(
  //               (columnName) => `${columnName.replace(/\s+/g, "_").trim()}`
  //             );
  //             console.log(col);
  //             // const columns = headerRow.map(
  //             //   (columnName) =>
  //             //     `"${columnName.replace(/\s+/g, "_").trim()}" VARCHAR(255)`
  //             // );
  //             const columns = headerRow.map(
  //               (columnName) =>
  //                 `${columnName.replace(/\s+/g, "_").trim()} VARCHAR(255)`
  //             );
  //             console.log(columns);
  //             const createGenericTableQuery = `CREATE TABLE IF NOT EXISTS generic_table (${columns.join(
  //               ", "
  //             )})`;

  //             const createGenericTableResult = await sails
  //               .getDatastore()
  //               .sendNativeQuery(createGenericTableQuery);

  //             for (let i = 0; i < jsonArray.length; i++) {
  //               const item = jsonArray[i];

  //               const insertValues = col
  //                 .map((columnName) => {
  //                   const value = item[columnName.replace(/\s+/g, "_").trim()];
  //                   if (value === null || value === undefined) {
  //                     return "NULL";
  //                   }
  //                   return `'${value.replace(/'/g, "''")}'`;
  //                 })
  //                 .join(", ");

  //               // const insertValues = columns
  //               //   .map((columnName) => {
  //               //     const value = item[columnName.replace(/"|'/g, "")]; // Remove quotes from column name
  //               //     if (value === undefined) {
  //               //       return "DEFAULT NULL";
  //               //     }
  //               //     return `'${value ? value.replace(/'/g, "''") : ""}'`;
  //               //   })
  //               //   .join(", ");

  //               // const insertValues = columns
  //               //   .map((columnName) => {
  //               //     console.log();
  //               //     const value = item[columnName.trim()];
  //               //     if (value === null) {
  //               //       return "NULL";
  //               //     }
  //               //     return `'${value ? value.replace(/'/g, "''") : value}'`;
  //               //   })
  //               //   .join(", ");

  //               console.log(insertValues);
  //               // const insertValuesQuery = `INSERT INTO generic_table (${col.join(
  //               //   ", "
  //               // )}) VALUES (${insertValues})`;

  //               // const insertResult = await sails
  //               //   .getDatastore()
  //               //   .sendNativeQuery(insertValuesQuery);
  //               // console.log("Values inserted successfully:", insertResult);
  //             }

  //             return res.send({
  //               message: "Data Added Successfully!!",
  //             });
  //           } catch (error) {
  //             return res.serverError(error);
  //           }
  //         }
  //         //  else if (extension === ".xlsx") {
  //         //   const workbook = xlsx.readFile(filePath);
  //         //   const sheetName = workbook.SheetNames[0];
  //         //   const worksheet = workbook.Sheets[sheetName];
  //         //   //get xlsx data
  //         //   const jsonArray = xlsx.utils.sheet_to_json(worksheet);
  //         //   //if file already exist data updated otherwise new data created
  //         //   if (fileUpload) {
  //         //     try {
  //         //       const updateFile = await Fileupload.updateOne({
  //         //         fileName: filename,
  //         //       }).set({ data: jsonArray });
  //         //       return res.send({
  //         //         message: "Data updated successfully!!",
  //         //         updateFile: updateFile,
  //         //       });
  //         //     } catch (error) {
  //         //       return res.serverError(error);
  //         //     }
  //         //   } else {
  //         //     try {
  //         //       const createdField = await Fileupload.create({
  //         //         data: jsonArray,
  //         //         fileName: filename,
  //         //       }).fetch();
  //         //       return res.json({
  //         //         message: "Data Added Successfully!!",
  //         //         fieldNames: createdField,
  //         //       });
  //         //     } catch (error) {
  //         //       return res.status(400).send({
  //         //         message: "Data Not Added!!",
  //         //       });
  //         //     }
  //         //   }
  //         // }
  //         else {
  //           return res.status(400).send({
  //             message: "Unsupported File Format",
  //           });
  //         }
  //       }
  //     );
  //   } catch (error) {
  //     return res.status(500).send({
  //       error: error,
  //       message: "File Not Uploaded!!",
  //     });
  //   }
  // },

  setData: async (req, res) => {
    try {
      // const genericDataQuery = "SELECT * FROM generic_table LIMIT 1";
      // const queryResult = await sails
      //   .getDatastore()
      //   .sendNativeQuery(genericDataQuery);
      // const row = queryResult.rows[0];
      // const fieldNames = Object.keys(row);
      // // const headerRow = Object.keys(jsonArray[0]);
      // const headerRow = Object.keys(rows[0]);
      // console.log(fieldNames);
      console.log(1);
      const getDataQuery = "SELECT data FROM generic_table LIMIT 1";
      const queryResult = await sails
        .getDatastore()
        .sendNativeQuery(getDataQuery);
      const row = queryResult.rows[0];
      const dataArray = row.data;

      const dataFieldValues = dataArray.map((obj) => obj.data);

      console.log(dataFieldValues);
      console.log(dataArray);
      return res.send(dataArray);
      //       const validatedArray = await sails.helpers.validation(
      //         jsonArray.map((item) => {
      //           const parsedItem = {};

      //           // map field with specific field
      //           const fieldMappingsArray = Object.entries(req.body).map(
      //             ([key, value]) => ({
      //               key,
      //               value: systemFields.includes(value)
      //                 ? value
      //                 : headerRow[key] || key,
      //             })
      //           );

      //           Object.entries(item).forEach(([key, value]) => {
      //             // Find the mapped key from the fieldMappingsArray
      //             const fieldMapping = fieldMappingsArray.find(
      //               (field) => field.key === key
      //             );

      //             if (fieldMapping) {
      //               const mappedKey = fieldMapping.value;

      //               if (!isNaN(value)) {
      //                 // Check if the value is too large to be parsed as an integer
      //                 if (Number(value) > Number.MAX_SAFE_INTEGER) {
      //                   // Store the value as a string
      //                   parsedItem[mappedKey] = value.toString();
      //                 } else {
      //                   parsedItem[mappedKey] = parseInt(value, 10);
      //                 }
      //               } else {
      //                 // Handle string values with special characters
      //                 parsedItem[mappedKey] =
      //                   typeof value === "string" ? value.replace(/'/g, "''") : value;
      //               }
      //             }
      //           });
      //           return parsedItem;
      //         })
      //       );

      //       //create table
      //       const firstObject = validatedArray.validatedArray[0];
      //       const keys = Object.keys(firstObject);

      //       //Define type
      //       const assignType = (value) => {
      //         if (typeof value === "string") {
      //           return "VARCHAR(255) DEFAULT NULL";
      //         } else if (!isNaN(value) && Number.isInteger(parseInt(value))) {
      //           return "BIGINT DEFAULT NULL";
      //         } else {
      //           return "VARCHAR(255) DEFAULT NULL";
      //         }
      //       };

      //       const columns = keys.map((key) => {
      //         const columnName = headerRow[key] || key;
      //         return `"${columnName}" ${assignType(firstObject[key])}`;
      //       });

      //       const createTableQuery = ` CREATE TABLE IF NOT EXISTS master_table (${columns.join(
      //         ", "
      //       )})`;

      //       const existingColumnsQuery = `
      //   SELECT column_name
      //   FROM information_schema.columns
      //   WHERE table_name = 'master_table'
      // `;
      //       const existingColumnsResult = await sails
      //         .getDatastore()
      //         .sendNativeQuery(existingColumnsQuery);
      //       const existingColumns = existingColumnsResult.rows.map(
      //         (row) => row.column_name
      //       );

      //       const fieldMappingsArray = Object.entries(req.body).map(
      //         ([key, value]) => ({
      //           key,
      //           value: systemFields.includes(value) ? value : headerRow[key] || key,
      //         })
      //       );

      //       const newColumns = [];
      //       const mappedKeys = fieldMappingsArray.map(
      //         (fieldMapping) => fieldMapping.value
      //       );

      //       mappedKeys.forEach((columnName) => {
      //         if (!existingColumns.includes(columnName)) {
      //           newColumns.push(columnName);
      //         }
      //       });

      //       if (newColumns.length > 0) {
      //         const alterTableQuery = `
      //     ALTER TABLE master_table
      //     ${newColumns
      //       .map((columnName) => `ADD COLUMN "${columnName}" VARCHAR(255)`)
      //       .join(", ")}
      //   `;
      //         await sails.getDatastore().sendNativeQuery(alterTableQuery);
      //       }

      //       const insertColumns = [...existingColumns, ...mappedKeys];

      //       for (const item of validatedArray.validatedArray) {
      //         const insertValues = `(${insertColumns
      //           .map((columnName) => `'${item[columnName] || ""}'`)
      //           .join(", ")})`;

      //         const insertDataQuery = `
      //     INSERT INTO master_table (${insertColumns
      //       .map((columnName) => `"${columnName}"`)
      //       .join(", ")})
      //     VALUES ${insertValues}
      //   `;

      //         const insertDataResult = await sails
      //           .getDatastore()
      //           .sendNativeQuery(insertDataQuery);
      //       }
      //       return res.send({
      //         message: "Data Added Successfully!!",
      //         fieldNames: headerRow,
      //         fieldValues: jsonArray,
      //       });

      // try {
      //   // Create table using native query
      //   const rawResult = await sails
      //     .getDatastore()
      //     .sendNativeQuery(createTableQuery);

      //   // Insert values into the created table

      //   const existingColumnsQuery = `
      //           SELECT column_name
      //           FROM information_schema.columns
      //           WHERE table_name = 'master_table'
      //         `;

      //   const existingColumnsResult = await sails
      //     .getDatastore()
      //     .sendNativeQuery(existingColumnsQuery);
      //   const existingColumns = existingColumnsResult.rows.map(
      //     (row) => row.column_name
      //   );
      //   console.log("existingColumnsResult", existingColumns);

      //   const newColumns = [];
      //   const mappedKeys = fieldMappingsArray.map(
      //     (fieldMapping) => fieldMapping.value
      //   );

      //   if (mappedKeys.length > 0) {
      //     const alterTableQuery = `
      //             ALTER TABLE master_table
      //             ${newColumns
      //               .map(
      //                 (columnName) => `ADD COLUMN "${columnName}" VARCHAR(255)`
      //               )
      //               .join(", ")}
      //           `;
      //     await sails.getDatastore().sendNativeQuery(alterTableQuery);
      //   }

      //   const insertColumns = [...existingColumns, ...mappedKeys];
      //   console.log("hello", insertColumns);
      //   for (const item of validatedArray.validatedArray) {
      //     const insertValues = `(${insertColumns
      //       .map((columnName) => `'${item[columnName] || ""}'`)
      //       .join(", ")})`;

      //     console.log(insertValues);

      //     const insertDataQuery = `
      //       INSERT INTO master_table (${insertColumns
      //         .map((columnName) => `"${columnName}"`)
      //         .join(", ")})
      //       VALUES ${insertValues}
      //     `;

      //     const insertDataResult = await sails
      //       .getDatastore()
      //       .sendNativeQuery(insertDataQuery);
      //   }

      //   //   // for (const item of validatedArray.validatedArray) {
      //   //   //   const insertValues = keys
      //   //   //     .map((key) => {
      //   //   //       const columnName = headerRow[key] || key;
      //   //   //       if (item[key] === null) {
      //   //   //         return "NULL";
      //   //   //       }
      //   //   //       return `'${item[key]}'`;
      //   //   //     })
      //   //   //     .join(", ");

      //   //   //   const insertValuesQuery = `INSERT INTO Master_table (${keys
      //   //   //     .map((key) => `"${key}"`)
      //   //   //     .join(", ")}) VALUES (${insertValues})`;

      //   //   //   const insertResult = await sails
      //   //   //     .getDatastore()
      //   //   //     .sendNativeQuery(insertValuesQuery);
      //   //   //   console.log("Values inserted successfully:", insertResult);
      //   //   // }
      // } catch (error) {
      //   console.error("Failed to create table or insert values:", error);
      // }

      return res.send(validatedArray);
    } catch (error) {
      return res.send(error);
    }
  },
};
