import { Jailbird } from "../app";

const shuffle = (array: any[]) => {
  var currentIndex = array.length, temporaryValue, randomIndex;
  
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
  
    // Create a random index to pick from the original array
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
  
    // Cache the value, and swap it with the current element
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  
  return array;
}

export { shuffle };