const { expect } = require("chai");
const path = require("path");
const fs = require('fs')
const inquirer = require("inquirer");
const generate = require("../../lib/generate");
const metadata = require("../../lib/options");
const render = require('consolidate').handlebars.render
const exists = require('fs').existsSync
const async =require('async')

const MOCK_TEMPLATE_BUILD_PATH = path.resolve("./test/e2e/mock-template-build");
console.log("MOCK_TEMPLATE_BUILD_PATH", MOCK_TEMPLATE_BUILD_PATH);
const MOCK_META_JSON_PATH = path.resolve("./test/e2e/mock-meta-json");
const MOCK_ERROR = path.resolve("./test/e2e/mock-error");
const MOCK_METALSMITH_CUSTOM_PATH = path.resolve('./test/e2e/mock-metalsmith-custom')
const MOCK_METALSMITH_CUSTOM_BEFORE_AFTER_PATH = path.resolve('./test/e2e/mock-metalsmith-custom-before-after')
const MOCK_METADATA_REPO_JS_PATH = path.resolve(
  "./test/e2e/mock-metadata-repo-js"
);
const MOCK_TEMPLATE_REPO_PATH = path.resolve("./test/e2e/mock-template-repo");

function monkeyPatchInquirer(answers) {
  // monkey patch inquirer
  inquirer.prompt = questions => {
    const key = questions[0].name;
    const _answers = {};
    const validate = questions[0].validate;
    const valid = validate(answers[key]);
    if (valid !== true) {
      return Promise.reject(new Error(valid));
    }
    _answers[key] = answers[key];
    return Promise.resolve(_answers);
  };
}

describe("gee-cli", () => {
  const answers = {
    name: "gee-cli-test",
    author: "common <unnkeol@gmail.com>",
    description: "gee-cli e2e test",
    preprocessor: {
      less: true,
      sass: true
    },
    pick: "no",
    noEscape: true
  };
  it("point out the file in the error", done => {
    monkeyPatchInquirer(answers);
    generate("test", MOCK_ERROR, MOCK_TEMPLATE_BUILD_PATH, err => {
      expect(err.message).to.match(/^\[readme\.md\] Parse error/);
      done();
    });
  });

  it("read metadata from json", () => {
    const meta = metadata("test-pkg", MOCK_TEMPLATE_REPO_PATH);
    expect(meta).to.be.an("object");
    expect(meta.prompts).to.have.property("description");
  });

  it("read metadata from js", () => {
    const meta = metadata("test-pkg", MOCK_METADATA_REPO_JS_PATH);
    expect(meta).to.be.an("object");
    expect(meta.prompts).to.have.property("description");
  });

  it('helpers', done => {
    monkeyPatchInquirer(answers)
    generate('test', MOCK_METADATA_REPO_JS_PATH, MOCK_TEMPLATE_BUILD_PATH, err => {
      if (err) done(err)
      const contents = fs.readFileSync(`${MOCK_TEMPLATE_BUILD_PATH}/readme.md`, 'utf-8')
      expect(contents).to.equal(answers.name.toUpperCase()+'\r\n')
      done()
    })
  })

  it('adds additional data to meta data', done => {
    const data = generate('test', MOCK_META_JSON_PATH, MOCK_TEMPLATE_BUILD_PATH, done)
    expect(data.destDirName).to.equal('test')
    expect(data.inPlace).to.equal(false)
  })

  it('sets `inPlace` to true when generating in same directory', done => {
    const currentDir = process.cwd()
    process.chdir(MOCK_TEMPLATE_BUILD_PATH)
    const data = generate('test', MOCK_META_JSON_PATH, MOCK_TEMPLATE_BUILD_PATH, done)
    expect(data.destDirName).to.equal('test')
    expect(data.inPlace).to.equal(true)
    process.chdir(currentDir)
  })

  it('template generation', done => {
    monkeyPatchInquirer(answers)
    generate('test', MOCK_TEMPLATE_REPO_PATH, MOCK_TEMPLATE_BUILD_PATH, err => {
      if (err) done(err)

      expect(exists(`${MOCK_TEMPLATE_BUILD_PATH}/src/yes.vue`)).to.equal(true)
      expect(exists(`${MOCK_TEMPLATE_BUILD_PATH}/src/no.js`)).to.equal(false)

      async.eachSeries([
        'package.json',
        'src/yes.vue'
      ], function (file, next) {
        const template = fs.readFileSync(`${MOCK_TEMPLATE_REPO_PATH}/template/${file}`, 'utf8')
        const generated = fs.readFileSync(`${MOCK_TEMPLATE_BUILD_PATH}/${file}`, 'utf8')
        render(template, answers, (err, res) => {
          if (err) return next(err)
          expect(res).to.equal(generated)
          next()
        })
      }, done)
    })
  })

  it('supports custom metalsmith plugins', done => {
    generate('test', MOCK_METALSMITH_CUSTOM_PATH, MOCK_TEMPLATE_BUILD_PATH, err => {
      if (err) done(err)

      expect(exists(`${MOCK_TEMPLATE_BUILD_PATH}/custom/readme.md`)).to.equal(true)

      async.eachSeries([
        'readme.md'
      ], function (file, next) {
        const template = fs.readFileSync(`${MOCK_METALSMITH_CUSTOM_PATH}/template/${file}`, 'utf8')
        const generated = fs.readFileSync(`${MOCK_TEMPLATE_BUILD_PATH}/custom/${file}`, 'utf8')
        render(template, { custom: 'Custom' }, (err, res) => {
          if (err) return next(err)
          expect(res).to.equal(generated)
          next()
        })
      }, done)
    })
  })

  it('supports custom metalsmith plugins with after/before object keys', done => {
    generate('test', MOCK_METALSMITH_CUSTOM_BEFORE_AFTER_PATH, MOCK_TEMPLATE_BUILD_PATH, err => {
      if (err) done(err)

      expect(exists(`${MOCK_TEMPLATE_BUILD_PATH}/custom-before-after/readme.md`)).to.equal(true)

      async.eachSeries([
        'readme.md'
      ], function (file, next) {
        const template = fs.readFileSync(`${MOCK_METALSMITH_CUSTOM_BEFORE_AFTER_PATH}/template/${file}`, 'utf8')
        const generated = fs.readFileSync(`${MOCK_TEMPLATE_BUILD_PATH}/custom-before-after/${file}`, 'utf8')
        render(template, { before: 'Before', after: 'After' }, (err, res) => {
          if (err) return next(err)
          expect(res).to.equal(generated)
          next()
        })
      }, done)
    })
  })
});
