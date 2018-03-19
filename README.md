# gee-cli

一个用于搭建 geetemp 团队项目的简单 CLI 工具

### 安装

```bash
$ npm install -g gee-cli
```

### 使用

```bash
$ gee init <template-name> <project-name>
```

例子:

```bash
$ gee init webpack-simple my-project
```

以上命令从[gee-templates/webpack-simple](http://git.i.com/gee-templates/webpack-simple)拉取模板，提示输入一些信息，生成项目到`./my-project/`。

### 团队模板库

团队模板库的目的是为了提供初始项目模板，让项目成员能尽快开始实际项目的开发。

所有的团队模板在[gee-templates 组织中](http://git.i.com/groups/gee-templates),当一个新的模板被添加到组织中后，你可以运行`vue init <template-name> <project-name>`来使用这个模板。

当前可以使用的模板包括:

* [webpack-simple](http://git.i.com/gee-templates/webpack-simple) - 一个简单的 Webpack+vue-loader 的快速启动模板

### 编写自定义模板

* 一个模板必须有一个`template`目录来存放模板文件。

* 一个模板可能有一个用于模板的元数据文件，`meta.js`或者`meta.json`文件。它可以包含下面的字段:

  * `prompts`: 用来收集用户的选项数据；

  * `filters`: 用来有条件地过滤文件去渲染；

  * `metalsmith`: 用来在插件链中添加自定义 metalsmith 插件；

  * `completeMessage`: 当模板被生成后，展示给用户的信息。你可以包含自定义信息；

  * `complete`: 替代使用`completeMessage`,你可以在模板被生成后，使用一个函数来生成展示给用户的信息；

#### prompts

在 metadata 文件中`prompts`字段应该是一个包含用户提示的对象散列。对于每一个实例，键是变量名，值是一个[Inquirer.js 的问题对象](https://github.com/SBoudrias/Inquirer.js/#question)。比如：

```json
{
  "prompts": {
    "name": {
      "type": "string",
      "required": true,
      "message": "Project name"
    }
  }
}
```

所有的提示操作完成后，在`template`中的所有文件会被[Handlebars](http://handlebarsjs.com/)以提示结果为数据来渲染。

##### 有条件的提示

一个提示能够被添加一个`when`字段来成为有条件的提示，`when`字段应该是一个从以前的提示中收集的数据来评估的 JavaScript 表达式。例如：

```json
{
  "prompts": {
    "lint": {
      "type": "confirm",
      "message": "Use a linter?"
    },
    "lintConfig": {
      "when": "lint",
      "type": "list",
      "message": "Pick a lint config",
      "choices": ["standard", "airbnb", "none"]
    }
  }
}
```

`lintConfig`提示只有当用户在回答`lint`提示为 yes 时，才会被触发。

##### 提前注册的 Handlebars Helpers

两个经常使用的 Handlebars Helpers，`if_eq`和`unless_eq`是提前被注册的:

```handlebars
{{#if_eq lintConfig "airbnb"}};{{/if_eq}}
```

##### 自定义 Handlebars Helpers

你可能想在 meatadata 文件中使用`helpers`字段来注册额外的 Handlebars helpers。对象的 key 是 helper 的名称:

```js
module.exports = {
  helpers: {
    lowercase: str => str.toLowerCase()
  }
};
```

一旦注册，他们能够像下面这样被使用:

```handlebars
{{ lowercase name }}
```

#### 文件过滤

在 metadata 文件中的`filters`字段是一个包含文件过滤规则的对象散列。对于每一个实例，key 是一个[minimatch glob pattern](https://github.com/isaacs/minimatch)，value 是一个在提示回答数据上下文中评估的 javascript 表达式，例如：

```json
{
  "filters": {
    "test/**/*": "needTests"
  }
}
```

如果提示`needTests`的回答是 yes，在 test 目录下的文件才会被生成。

#### 跳过渲染

在 metadata 文件中的`skipInterpolation`字段应该是一个[minimatch glob pattern](https://github.com/isaacs/minimatch)。匹配的文件应该被跳过渲染。例如：

```json
{
  "skipInterpolation": "src/**/*.vue"
}
```

#### Metalsmith

`gee-cli`使用了[metalsmith](https://github.com/segmentio/metalsmith)来生成项目。

你可以自定义由 gee-cli 创建的 metalsmith 构建器，来注册自定义插件。

```js
"metalsmith": function (metalsmith, opts, helpers) {
    function customMetalsmithPlugin (files, metalsmith, done) {
      // Implement something really custom here.
      done(null, files)
    }

    metalsmith.use(customMetalsmithPlugin)
  }
```

如果你需要在问题被回答之前，获取 metalsmith 的钩子，你可以使用`before`关键词:

```js
{
    "metalsmith":{
        before:function(metalsmith,opts,helpers){},
        after:function(metalsmith,opts,helpers){}
    }
}
```

#### 在 meta.{js,json}文件中额外可访问的数据

* `destDirName` - 目的文件夹名称

```json
{
  "completeMessage":
    "To get started:\n\n  cd {{destDirName}}\n  npm install\n  npm run dev"
}
```

* `inPlace` - 是否生成模板到当前目录

```json
{
  "completeMessage":
    "{{#inPlace}}To get started:\n\n  npm install\n  npm run dev.{{else}}To get started:\n\n  cd {{destDirName}}\n  npm install\n  npm run dev.{{/inPlace}}"
}
```

#### `complete` 方法

参数:

* `data`:在`completeMessage`可以访问的相同的数据:

```js
{
  complete (data) {
    if (!data.inPlace) {
      console.log(`cd ${data.destDirName}`)
    }
  }
}
```

* `helpers`:你可以用来记录日志结果的一些工具

  * `chalk`:`chalk`模块
  * `logger`: gee-cli 内建的日志工具
  * `files`: 一组生成的文件

```js
  {
    complete (data, {logger, chalk}) {
      if (!data.inPlace) {
        logger.log(`cd ${chalk.yellow(data.destDirName)}`)
      }
    }
  }
```
