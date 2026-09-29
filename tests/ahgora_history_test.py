import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('ahgora', Path(__file__).parents[1] / 'scripts/prepare-ahgora-history.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class AhgoraHistoryTests(unittest.TestCase):
    def test_quoted_names_and_utf8_are_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'source.csv'
            p.write_text('Matrícula;Nome;CPF;Período;SALDO\n001;"João; Silva";01234567890;09/2026;-120:15\n', encoding='utf-8-sig')
            _, rows = m.read_rows(p)
            parsed, skipped = m.monthly(rows)
            self.assertEqual(parsed[0]['nome'], 'João; Silva')
            self.assertEqual(parsed[0]['cpf'], '01234567890')
            self.assertEqual(parsed[0]['saldo'], '-120:15')
            self.assertEqual(skipped, [])

    def test_totals_and_empty_periods_are_not_monthly_employee_records(self):
        rows = [{'Matrícula':'', 'Nome':'Total', 'CPF':'', 'Período':'09/2026'},
                {'Matrícula':'001', 'Nome':'Nome', 'CPF':'', 'Período':''}]
        self.assertEqual(m.monthly(rows), ([], [1, 2]))

    def test_repeated_employee_month_is_rejected(self):
        row = {'Matrícula':'001', 'Nome':'Nome', 'CPF':'', 'Período':'09/2026'}
        with self.assertRaises(ValueError):
            m.monthly([row, row])

    def test_invalid_hours_cannot_silently_become_zero(self):
        with self.assertRaises(ValueError):
            m.monthly([{'Matrícula':'001','Nome':'Nome','CPF':'','Período':'09/2026','SALDO':'1,25'}])

    def test_sql_quotes_source_text(self):
        self.assertEqual(m.sql("D'Ávila"), "'D''Ávila'")

    def test_consolidated_days_and_dated_bank_balance(self):
        rows = [{'Matrícula':'001','Nome':'Nome','CPF':'','Período':'01/2025',
                 'FALTA INJUSTIFICADA':'08:00','FALTA INJUSTIFICADA (dias)':'1',
                 'FERIAS':'16:00','FERIAS (dias)':'2','ATESTADO MEDICO':'04:00',
                 'Banco de horas acumulado até Dezembro/2024':'-12:30',
                 'Banco de horas acumulado até Fevereiro/2025':''}]
        parsed, _ = m.monthly(rows)
        self.assertEqual(parsed[0]['falta_injustificada_dias'], 1)
        self.assertEqual(parsed[0]['ferias_horas'], '16:00')
        self.assertEqual(parsed[0]['ferias_dias'], 2)
        self.assertEqual(parsed[0]['atestado_medico'], '04:00')
        self.assertEqual(parsed[0]['banco_horas_acumulado'], '-12:30')

    def test_ambiguous_bank_balances_are_rejected(self):
        with self.assertRaises(ValueError):
            m.monthly([{'Matrícula':'001','Nome':'Nome','CPF':'','Período':'01/2025',
                       'Banco de horas acumulado até Dezembro/2024':'01:00',
                       'Banco de horas acumulado até Fevereiro/2025':'02:00'}])

    def test_fractional_days_are_not_silently_truncated(self):
        with self.assertRaises(ValueError):
            m.monthly([{'Matrícula':'001','Nome':'Nome','CPF':'','Período':'01/2025',
                       'FALTA INJUSTIFICADA (dias)':'1.5'}])


if __name__ == '__main__':
    unittest.main()
