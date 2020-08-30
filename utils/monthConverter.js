class MonthConverter {
  constructor(number) {
    this.month = number;
  }

  getMonthName() {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'Sempteber',
      'October',
      'November',
      'December',
    ];

    if (!monthNames[this.month - 1]) return null;
    return monthNames[this.month - 1];
  }
}

module.exports = MonthConverter;
