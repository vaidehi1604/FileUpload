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
    let passCount = 0;
    let failCount = 0;
    let total = {};
    Validator.register("Length", (value, requirement, attribute) => {
      return value.toString().length === parseInt(requirement);
    });

    // Define your validation rules
    const validationRules = {
      "Given name": "string",
      Surname: "string",
      Email: "email",
      Phone: "Length:10",
      Address: "string",
      "Blood Group": "string",
      Description: "string",
      Country: "string",
      Id: "string",
      Website: "string",
      Year: "integer",
      "Employee No": "integer",
      Date: "date",
      Gender: "string",
      Title: "string",
      Industry: "string",
    };

    const { jsonArray } = inputs;

    const validatedArray = jsonArray.map((item) => {
      total = Object.keys(item).length;
      const validator = new Validator(item, validationRules);

      const validationPassed = validator.passes();
      if (item.hasOwnProperty("Email")) {
        const count = jsonArray.filter((i) => i.Email === item.Email).length;
        if (count > 1) {
          failCount = failCount + 1;
          item.Email = null;
        }
      }
      if (!validationPassed) {
        console.error("Validation errors:", validator.errors.all());
        console.log(failCount);
        // Replace invalid values with null
        for (let field in validationRules) {
          if (item.hasOwnProperty(field) && validator.errors.has(field)) {
            failCount = failCount + 1;
            item[field] = null;
          }
        }
      }
      return item;
    });

    const Total = total * validatedArray.length;

    passCount = Total - failCount;

    const validatedata = {
      pass: passCount,
      fail: failCount,
      Total: Total,
      validatedArray: validatedArray,
    };
    return validatedata;
  },
};
