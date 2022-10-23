const fs = require("fs");
const execa = require("execa");
// 过滤packages目录下所有模块
const targets = fs.readdirSync("packages").filter((f) => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
        return false;
    }
    return true;
});
// 开始并行打包
runParallel(targets, build);
async function runParallel(source, iteratorFn) {
    const ret = [];
    for (const item of source) {
        const p = iteratorFn(item);
        ret.push(p);
    }
    return Promise.all(ret);
}
async function build(target) {
    await execa("rollup", ["-c", "--environment", `TARGET:${target}`], {
        stdio: "inherit",
    });
}
