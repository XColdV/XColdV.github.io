const fs = require('fs');

function extractItemId(line) {
    const match = line.match(/add_item\\(\d+)\\/);
    return match ? match[1] : null;
}

function loadReplaceIds() {
    try {
        const configData = fs.readFileSync('config.json', 'utf8');
        const config = JSON.parse(configData);
        return config.replace_id || [];
    } catch (error) {
        console.error("Error loading replace IDs from config.json:", error);
        return [];
    }
}

function replaceNullItems(oldgtpsLines, newrgtLines) {
    const modifiedLines = [];
    const replaceIds = loadReplaceIds();
    let skipProcessing = false;
    for (const line2 of newrgtLines) {
        if (line2.includes('null_item') || replaceIds.some(id => line2.includes(`\\${id}\\`))) {
            if (skipProcessing) {
                console.log("Skipping processing because the first line contains null_item.");
                continue;
            }
            const itemId = extractItemId(line2);
            if (itemId) {
                let foundMatchingLine = false;
                for (const line1 of oldgtpsLines) {
                    if (line1.includes('add_item')) {
                        const match = line1.match(/add_item\\(\d+)\\/);
                        if (match && (match[1] === itemId)) {
                            if (line1.includes('null_item')) {
                                break;
                            } else {
                                modifiedLines.push(line1);
                                foundMatchingLine = true;
                                console.log("Modified line (IMPORTED FROM OLDGTPS.txt) added:", line1);
                                break;
                            }
                        }
                    }
                }
                if (!foundMatchingLine) {
                    modifiedLines.push(line2);
                    console.log("Original line (IMPORTED FROM NEWRGT) added:", line2);
                }
            } else {
                console.log("No item ID found in the expected position. Skipping line:", line2);
            }
        } else {
            modifiedLines.push(line2);
            if (!skipProcessing && line2.includes('null_item')) {
                skipProcessing = true;
            } 
        }
    }
    return modifiedLines;
}

function main() {
    const oldgtpsLines = fs.readFileSync('oldgtps.txt', 'utf8').split('\n');
    const newrgtLines = fs.readFileSync('newrgt.txt', 'utf8').split('\n');
    const modifiedLines = replaceNullItems(oldgtpsLines, newrgtLines);
    fs.writeFileSync('newrgt.txt', modifiedLines.join('\n'), 'utf8');
    console.log("Modification completed.");
}

main();
