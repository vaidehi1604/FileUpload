const Validator = require("validatorjs");

module.exports = {
  friendlyName: "Validation",

  description: "Validate File.",

  inputs: {
    jsonArray: {
      type: "ref",
      required: true,
      description: "The JSON array to validate.",
    },
  },

  exits: {
    success: {
      description: "All items validated successfully.",
    },
  },

  fn: async function (inputs) {
    
    Validator.register(
      "phoneLength",
      (value, requirement, attribute) => {
        return value.toString().length === parseInt(requirement);
      },
      "The :attribute must be exactly :length characters long."
    );

    // Define your validation rules
    const validationRules = {
      id: "integer",
      name: "string",
      user: "string",
      firstname: "string",
      lastname: "string",
      address: "string",
      contact: "phoneLength:10",
      bloodgroup: "string",
      email: "email",
      age: "integer",
      phoneno: "phoneLength:10",
      parentno: "phoneLength:10",
      class: "string",
    };

    const { jsonArray } = inputs;
    console.log(jsonArray);
    const validatedArray = jsonArray.map((item) => {
      const validator = new Validator(item, validationRules);
      const validationPassed = validator.passes();

      if (!validationPassed) {
        console.error("Validation errors:", validator.errors.all());

        // Replace invalid values with null
        for (let field in validationRules) {
          if (item.hasOwnProperty(field) && validator.errors.has(field)) {
            item[field] = null;
          }
        }
      }

      return item;
    });

    return validatedArray;
  },
};
