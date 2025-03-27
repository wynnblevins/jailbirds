const fs = require('fs');
const readline = require('readline');

/**
 * Utility function to read in a file line by line
 * 
 * @param fileName 
 * @returns an array of strings representing each line in the provided file
 */
export async function processLineByLine(fileName: string) {
  const allNames = [];
  const fileStream = fs.createReadStream(fileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    allNames.push(line);
  }

  return allNames;
}