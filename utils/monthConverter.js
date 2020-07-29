class MonthConverter {
  constructor(number) {
    this.month = number;
  }

  getMonthName() {
    try {
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

      return monthNames[this.month - 1];
    } catch (error) {
      return error;
    }
  }
}

module.exports = MonthConverter;
