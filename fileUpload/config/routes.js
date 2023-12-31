/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  "POST /file": "FileController.fileUpload",
  "POST /file/mapping": "FileController.fileMapping",
  // store data
  "POST /data": "DataStoreController.storeData",
  "POST /store": "DataStoreController.setData",
  // createTable

  "POST /create": "DataStoreController.createTable",
};
