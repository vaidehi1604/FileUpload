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

    Validator.register("uniquePhone", (value, requirement, attribute, data) => {
      const count = data.filter((item) => item.phone === value).length;
      return count <= 1 && value.toString().length === parseInt(requirement);
    });

    // Define your validation rules
    const validationRules = {
      "Given name": "string",
      "Blood Group": "string",
      phone: "Length:10",
      name: "string",
      user: "string",
      surname: "string",
      address: "string",
      contact: "Length:10",
      bloodgroup: "string",
      email: "email",
      age: "integer",
      description: "string",
      parentno: "Length:10",
      class: "string",
      Country: "string",
      Id: "string",
      website: "string",
      Year: "integer",
      title: "string",
      "Employee No": "integer",
      Date: "date",
      gender: "string",
    };

    const { jsonArray } = inputs;
    console.log(jsonArray);
    const validatedArray = jsonArray.map((item) => {
      total = Object.keys(item).length;
      const validator = new Validator(item, validationRules);

      const validationPassed = validator.passes();
      if (item.hasOwnProperty("email")) {
        const count = jsonArray.filter((i) => i.email === item.email).length;
        if (count > 1) {
          failCount = failCount + 1;
          item.email = null;
        }
      }
      if (!validationPassed) {
        console.error(
          "Validation errors:",
          // failCount++,
          validator.errors.all()
        );
        console.log(failCount);
        // Replace invalid values with null
        for (let field in validationRules) {
          if (item.hasOwnProperty(field) && validator.errors.has(field)) {
            // failCount[field] = (failCount[field] || 0) + 1;
            failCount = failCount + 1;
            item[field] = null;
          }
        }
      }
      return item;
    });

    const Total = total * validatedArray.length;

    passCount = Total - failCount;
    console.log("Passcount=", passCount);
    console.log("Failcount=", failCount);
    console.log("Total=", total * validatedArray.length);
    const validatedata = {
      pass: passCount,
      fail: failCount,
      Total: Total,
      validatedArray: validatedArray,
    };
    return validatedata;
  },
};
