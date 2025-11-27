import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  RadioGroup,
  Radio,
  Grid,
} from '@mui/material';
import type { CreateRecurrenceRequest, RecurrenceType, RecurrenceEndType } from '../../types';

interface RecurrenceSettingsProps {
  value?: CreateRecurrenceRequest;
  onChange: (value: CreateRecurrenceRequest | undefined) => void;
}

const recurrenceTypeOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'yearly', label: 'Ежегодно' },
  { value: 'custom', label: 'Пользовательское' },
];

const weekDays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
];

export const RecurrenceSettings = ({ value, onChange }: RecurrenceSettingsProps) => {
  const [enabled, setEnabled] = useState(!!value);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    value?.recurrence_type || 'daily'
  );
  const [intervalValue, setIntervalValue] = useState(value?.interval_value || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.days_of_week || []);
  const [dayOfMonth, setDayOfMonth] = useState(value?.day_of_month || 1);
  const [endType, setEndType] = useState<RecurrenceEndType>(value?.end_type || 'never');
  const [endDate, setEndDate] = useState(value?.end_date || '');
  const [maxOccurrences, setMaxOccurrences] = useState(value?.max_occurrences || 10);

  useEffect(() => {
    if (enabled) {
      const recurrence: CreateRecurrenceRequest = {
        recurrence_type: recurrenceType,
        interval_value: intervalValue,
        end_type: endType,
      };

      if (recurrenceType === 'weekly' && daysOfWeek.length > 0) {
        recurrence.days_of_week = daysOfWeek;
      }

      if (recurrenceType === 'monthly') {
        recurrence.day_of_month = dayOfMonth;
      }

      if (endType === 'date' && endDate) {
        recurrence.end_date = endDate;
      }

      if (endType === 'count') {
        recurrence.max_occurrences = maxOccurrences;
      }

      onChange(recurrence);
    } else {
      onChange(undefined);
    }
  }, [
    enabled,
    recurrenceType,
    intervalValue,
    daysOfWeek,
    dayOfMonth,
    endType,
    endDate,
    maxOccurrences,
    onChange,
  ]);

  const handleToggle = () => {
    setEnabled(!enabled);
  };

  const handleWeekDayToggle = (day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Box>
      <FormControlLabel
        control={<Checkbox checked={enabled} onChange={handleToggle} />}
        label={<Typography variant="subtitle1">Повторяющаяся задача</Typography>}
      />

      {enabled && (
        <Box sx={{ mt: 2, pl: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Recurrence Type */}
          <FormControl fullWidth size="small">
            <InputLabel>Тип повторения</InputLabel>
            <Select
              value={recurrenceType}
              label="Тип повторения"
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
            >
              {recurrenceTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Interval */}
          {recurrenceType !== 'weekly' && (
            <TextField
              label={
                recurrenceType === 'daily'
                  ? 'Каждые N дней'
                  : recurrenceType === 'monthly'
                    ? 'Каждые N месяцев'
                    : recurrenceType === 'yearly'
                      ? 'Каждые N лет'
                      : 'Каждые N часов'
              }
              type="number"
              size="small"
              value={intervalValue}
              onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              fullWidth
            />
          )}

          {/* Weekly - Days of Week */}
          {recurrenceType === 'weekly' && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Дни недели:
              </Typography>
              <FormGroup row>
                {weekDays.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={daysOfWeek.includes(day.value)}
                        onChange={() => handleWeekDayToggle(day.value)}
                        size="small"
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
              <TextField
                label="Каждые N недель"
                type="number"
                size="small"
                value={intervalValue}
                onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                fullWidth
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {/* Monthly - Day of Month */}
          {recurrenceType === 'monthly' && (
            <TextField
              label="День месяца"
              type="number"
              size="small"
              value={dayOfMonth}
              onChange={(e) =>
                setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
              }
              inputProps={{ min: 1, max: 31 }}
              fullWidth
            />
          )}

          <Divider />

          {/* End Type */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Окончание повторения:
            </Typography>
            <RadioGroup
              value={endType}
              onChange={(e) => setEndType(e.target.value as RecurrenceEndType)}
            >
              <FormControlLabel value="never" control={<Radio size="small" />} label="Никогда" />
              <FormControlLabel
                value="date"
                control={<Radio size="small" />}
                label="До определённой даты"
              />
              {endType === 'date' && (
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(endDate)}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  fullWidth
                  sx={{ ml: 4, mt: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              <FormControlLabel
                value="count"
                control={<Radio size="small" />}
                label="После количества повторений"
              />
              {endType === 'count' && (
                <TextField
                  type="number"
                  size="small"
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1 }}
                  fullWidth
                  sx={{ ml: 4, mt: 1 }}
                  label="Количество повторений"
                />
              )}
            </RadioGroup>
          </Box>
        </Box>
      )}
    </Box>
  );
};

