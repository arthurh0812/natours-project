exports.getRandomElements = (array, num) => {
  const randomNumbers = [];

  for (let i = 1; i <= num; i += 1) {
    if (i > array.length) break;
    const number = Math.floor(Math.random() * array.length);

    if (!randomNumbers.includes(number)) {
      randomNumbers.push(number);
    } else {
      i -= 1;
    }
  }

  return randomNumbers.map((number) => array[number]);
};
