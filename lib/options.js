const path = require("path");
const exists = require("fs").existsSync;
const metadata = require("read-metadata");
const validateName = require("validate-npm-package-name");
const getGitUser = require("./git-user");

/**
 * 获取模板元数据
 * @param {String} name
 * @param {String} dir
 * @return {Object}
 */
module.exports = function options(name, dir) {
  const opts = getMetadata(dir);
  setDefault(opts, "name", name);
  setValidateName(opts);

  const author = getGitUser();
  if (author) {
    setDefault(opts, "author", author);
  }

  return opts;
};

/**
 * 从meta.json或meta.js中获取元数据
 * @param {String} dir
 */
function getMetadata(dir) {
  const json = path.join(dir, "meta.json");
  const js = path.join(dir, "meta.js");
  let opts = {};

  if (exists(json)) {
    opts = metadata.sync(json);
  } else if (exists(js)) {
    const req = require(path.resolve(js));
    if (req !== Object(req)) {
      throw new Error("meta.js needs to expose an object");
    }
    opts = req;
  }

  return opts;
}

/**
 * 为确认问题设置默认值
 * @param {Object} opts
 * @param {String} key
 * @param {String} value
 */
function setDefault(opts, key, value) {
  const prompts = opts.prompts || (opts.prompts = {});
  if (!prompts[key] || typeof prompts[key] !== "object") {
    prompts[key] = {
      type: "input",
      default: value
    };
  } else {
    prompts[key]["default"] = value;
  }
}

/**
 * 设置项目名称验证
 * @param {Object} opts
 */
function setValidateName(opts) {
  const name = opts.prompts.name;
  const customValidate = name.validate;
  name.validate = name => {
    const validate = validateName(name);
    if (!validate.validForNewPackages) {
      const errors = (validate.errors || []).concat(validate.warnings);
      return "Sorry, " + errors.join(" and ") + ".";
    }
    if (typeof customValidate === "function") return customValidate(name);
    return true;
  };
}
