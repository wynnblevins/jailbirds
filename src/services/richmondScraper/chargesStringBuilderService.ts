export const buildChargesStr = async (charges: any[]): Promise<string> => {
  let chargesStr = '';
  const chargesMap: { [key: string]: number } = {};

  // build a map of the current inmate's charges and their counts
  for (let i = 0; i < charges.length; i++) {
    const charge = charges[i];
    let chargeHandle = await charge.getProperty('innerText');
    let chargeText = await chargeHandle.jsonValue();
    if (chargesMap.hasOwnProperty(chargeText)) {
      chargesMap[chargeText]++; 
    } else {
      chargesMap[chargeText] = 1;
    }
  }

  // append the charges into one long string
  for (let charge in chargesMap) {
    if (chargesMap[charge] > 1) {
      chargesStr += `${charge} (x${chargesMap[charge]}), `;
    } else {
      chargesStr += `${charge}, `;
    }
  }

  if (chargesStr.endsWith(', ')) {
    chargesStr = chargesStr.slice(0, -2); 
  }
  
  return chargesStr;
};
