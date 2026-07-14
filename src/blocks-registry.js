export const CURRENT_DATA_FIELDS = [
  'cap',
  'interest_expense',
  'fnd6_epspx',
  'volume',
  'returns',
  'revenue'
]

export const BLOCK_TEMPLATES = [
  {
    name: 'Historic undervalue',
    category: 'Custom',
    template: 'ts_<<shape>>(ts_backfill(<<x>>, <<backfill period>>) / close, <<lookback period>>)',
    arguments: [
      { name: 'x', type: 'input', value: '' },
      { name: 'backfill period', type: 'integer', value: 10 },
      { name: 'shape', type: 'operator', options: ['rank', 'scale', 'zscore'], value: 'rank' },
      { name: 'lookback period', type: 'integer', value: 20 }
    ]
  },
  {
    name: 'Time-Series Mean',
    category: 'Basic',
    template: 'ts_mean(<<x>>, <<days>>)',
    arguments: [
      { name: 'days', type: 'integer', value: 10 }
    ]
  },
  {
    name: 'Negate',
    category: 'Basic',
    template: '-1 * <<x>>',
    arguments: [
      { name: 'x', type: 'input', value: '' }
    ]
  },
  {
    name: 'Delta Difference',
    category: 'Basic',
    template: 'delta(<<x>>, <<period>>)',
    arguments: [
      { name: 'period', type: 'integer', value: 5 }
    ]
  }
]
