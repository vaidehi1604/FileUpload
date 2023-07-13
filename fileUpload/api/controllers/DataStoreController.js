const csv = require("convert-csv-to-json");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

module.exports = {
  storeData: async (req, res) => {
    let counter = 0;
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

          function getCounter() {
            counter++;
            return counter;
          }
          const tablename = `col-${getCounter()}`;
          console.log(tablename);
          //   const timestamp = Date.now(); // Get the current timestamp
          //   const str = `file_${timestamp}`;
          //   csv file uploaded
          if (extension === ".csv") {
            const buffer = fs.readFileSync(filePath);
            // Convert the buffer to a string
            const csvString = buffer.toString();

            // Extract the header row
            const lines = csvString.split("\n");
            const headerRow = lines[0].split(",");
            console.log(headerRow);
            //get data in json form
            const jsonArray = csv.fieldDelimiter(",").getJsonFromCsv(filePath);
            //if file already exist data updated otherwise new data created
            console.log(jsonArray);
            try {
              const createTableQuery = `CREATE TABLE "${`col-${getCounter()}`}" (data varchar)`;

              const rawResult = await sails
                .getDatastore()
                .sendNativeQuery(createTableQuery);

              const insertResult = await sails
                .getDatastore()
                .sendNativeQuery(
                  `INSERT INTO "${tablename}" (data) VALUES ($1)`,
                  [JSON.stringify(jsonArray)]
                );

              return res.send({
                message: "Data Added Successfully!!",
                fieldNames: createTableQuery,
              });
            } catch (error) {
              return res.serverError(error);
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
};
