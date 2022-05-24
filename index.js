const core = require("@actions/core");
const fs = require("fs");
const path = require("path");

function compareItems(a, b) {
    const aType = a.isDirectory() ? 1 : 2;
    const bType = b.isDirectory() ? 1 : 2;
    const typeOrder = aType - bType;
    if (typeOrder !== 0) {
        return typeOrder;
    }

    if (a.name < b.name) {
        return 1;
    }
    
    if (a.name > b.name) {
        return -1;
    }

    return 0;
}

function getItems(path) {
    const items = fs
        .readdirSync(path, { withFileTypes: true })
        .filter(item => item.isFile() || item.isDirectory());
    items.sort(compareItems);
    return items;
}

function mapItem(item, currentPath, depth = 0, result) {
    const indent = "".padStart(depth * 3, " ");
    const itemPath = path.join(currentPath, item.name);

    if (item.isDirectory()) {
        result.push(`${indent}${depth === 0 ? "##" : "-"} ${item.name}`);
        for (const childItem of getItems(itemPath)) {
            mapItem(childItem, itemPath, depth + 1, result);
        }
    } else if (item.isFile()) {
        const fileName = path.parse(item.name).name;
        result.push(`${indent}- [${fileName}](${fileName})`);
    }
}

try {
    const root = ".";
    const excludedItems = [".git", "home.md", "_Sidebar.md", ...core.getMultilineInput('exclude')];
    console.log("Generating custom sidebar in current working directory");
    console.log(`Exluding the following directories: ${excludedItems.join(",")}`);

    const items = getItems(root).filter(item => !excludedItems.includes(item.name))
    const content = ["# [Home](./)"];
    for (const item of items) {
        mapItem(item, root, 0, content);
    }
    fs.writeFileSync(path.join(root, "_Sidebar.md"), content.join("\n"), "utf-8");
} catch (error) {
    core.setFailed(error.message);
}
