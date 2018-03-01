const Metalsmith = require("metalsmith");
const chalk = require("chalk");
const Handlebars = require("handlebars");
const async = require("async");
const render = require("consolidate").handlebars.render; //模板引擎合集
const path = require("path");
const multimatch = require("multimatch");
const getOptions = require("./options");
const ask = require("./ask");
const filter = require("./filter");
const logger = require("./logger");

// register handlebars helper
Handlebars.registerHelper("if_eq", function(a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});

Handlebars.registerHelper("unless_eq", function(a, b, opts) {
  return a === b ? opts.inverse(this) : opts.fn(this);
});

module.exports = function generate(name, src, dest, done) {
  const opts = getOptions(name, src); //获取meta配置项
  const metalsmith = Metalsmith(path.join(src, "template"));
  const helpers = { chalk, logger };

  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  });

  //handlebars注册helpers
  opts.helpers &&
    Object.keys(opts.helpers).map(key => {
      Handlebars.registerHelper(key, opts.helpers[key]);
    });

  if (opts.metalsmith && typeof opts.metalsmith.before === "function") {
    opts.metalsmith.before(metalsmith, opts, helpers);
  }

  metalsmith
    .use(askQuestions(opts.prompts))
    .use(filterFiles(opts.filters))
    .use(renderTemplateFiles(opts.skipInterpolation));

  if (typeof opts.metalsmith === "function") {
    opts.metalsmith(metalsmith, opts, helpers);
  } else if (opts.metalsmith && typeof opts.metalsmith.after === "function") {
    opts.metalsmith.after(metalsmith, opts, helpers);
  }

  metalsmith
    .clean(false)
    .source(".")
    .destination(dest)
    .build((err, files) => {
      done(err);
      if (typeof opts.complete === "function") {
        const helpers = { chalk, logger, files };
        opts.complete(data, helpers);
      } else {
        logMessage(opts.completeMessage, data);
      }
    });

  return data;
};

/**
 * 询问问题插件
 * @param {Object} prompts
 */
function askQuestions(prompts) {
  return (files, metalsmith, done) => {
    ask(prompts, metalsmith.metadata(), done);
  };
}

/**
 * 过滤文件插件
 * @param {Object} filters
 */
function filterFiles(filters) {
  return (files, metalsmith, done) => {
    filter(files, filters, metalsmith.metadata(), done);
  };
}

/**
 * 渲染模板文件
 */
function renderTemplateFiles() {
  return (files, metalsmith, done) => {
    const keys = Object.keys(files);
    const metalsmithMetadata = metalsmith.metadata();
    async.each(
      keys,
      (file, next) => {
        const str = files[file].contents.toString();
        if (!/{{([^{}]+)}}/g.test(str)) {
          return next();
        }
        render(str, metalsmithMetadata, (err, res) => {
          if (err) {
            err.message = `[${file}] ${err.message}`;
            return next(err);
          }
          files[file].contents = new Buffer(res);
          next();
        });
      },
      done
    );
  };
}

function logMessage(message, data) {
  if (!message) return;
  render(message, data, (err, res) => {
    if (err) {
      console.error(
        "\n   Error when rendering template complete message: " +
          err.message.trim()
      );
    } else {
      console.log(
        "\n" +
          res
            .split(/\r?\n/g)
            .map(line => "   " + line)
            .join("\n")
      );
    }
  });
}
