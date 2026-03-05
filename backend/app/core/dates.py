import calendar
import datetime as dt


def add_months(value: dt.date, months: int) -> dt.date:
    month_index = (value.month - 1) + months
    year = value.year + (month_index // 12)
    month = (month_index % 12) + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return dt.date(year, month, day)
