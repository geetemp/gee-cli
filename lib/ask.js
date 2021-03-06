const async = require("async");
const inquirer = require("inquirer");
const evaluate = require("./eval");

const promptMapping = {
  string: "input",
  boolean: "confirm"
};

module.exports = function ask(prompts, data, done) {
  async.eachSeries(
    Object.keys(prompts),
    (key, next) => {
      prompt(key, prompts[key], data, next);
    },
    done
  );
};

/**
 * 问题调查
 * @param {String} key
 * @param {Object} prompt
 * @param {Object} data
 * @param {Function} done
 */
function prompt(key, prompt, data, done) {
  if (prompt.when && !evaluate(prompt.when, data)) {
    return done();
  }

  let promptDefault = prompt.default;
  if (typeof prompt.default === "function") {
    promptDefault = function() {
      return prompt.default.bind(this)(data);
    };
  }

  inquirer
    .prompt([
      {
        type: promptMapping[prompt.type] || prompt.type,
        name: key,
        message: prompt.message || prompt.label || key,
        default: promptDefault,
        choices: prompt.choices || [],
        validate: prompt.validate || (() => true)
      }
    ])
    .then(answers => {
      if (Array.isArray(answers[key])) {
        data[key] = {};
        answers[key].forEach(multiChoiceAnswer => {
          data[key][multiChoiceAnswer] = true;
        });
      } else if (typeof answers[key] === "string") {
        data[key] = answers[key].replace(/"/g, '\\"');
      } else {
        data[key] = answers[key];
      }
      done();
    })
    .catch(done);
}
