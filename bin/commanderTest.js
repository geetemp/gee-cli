var program = require("commander");

//option
program
  .version("0.1.0")
  .option("-p, --peppers", "Add peppers")
  .option("-P, --pineapple", "Add pineapple")
  .option("-b, --bbq-sauce", "Add bbq sauce")
  .option(
    "-c, --cheese [type]",
    "Add the specified type of cheese [marble]",
    "marble"
  )
  .option("-n <type>", "", "common")
  .option("--no-sauce", "Remove sauce")
  .option("--sauce", "add sauce");

console.log("you ordered a pizza with:");
if (program.peppers) console.log("  - peppers", program.peppers);
if (program.pineapple) console.log("  - pineapple", program.pineapple);
if (program.bbqSauce) console.log("  - bbq", program.bbqSauce);
console.log("  - %s cheese", program.cheese);
console.log("  - %s N", program.N);
console.log("program.args", program.args);

if (program.sauce) console.log(" with sauce");
else console.log(" without sauce");

//command
program
  .command("rm <dir>")
  .option("-r, --recursive", "Remove recursively")
  .action(function(dir, cmd) {
    console.log("remove " + dir + (cmd.recursive ? " recursively" : ""));
  });

program.command("*", "deploy the given env").action(function(env, ss) {
  console.log('deploying "%s" as "%s"', env, ss);
});

program.parse(process.argv);
