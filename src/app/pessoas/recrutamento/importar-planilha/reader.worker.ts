import * as XLSX from "xlsx";
import { readBulkCsv } from "@/lib/pessoas/bulk-model";
import { TALENT_FILE_BYTES, TALENT_FILE_ROWS } from "@/lib/pessoas/talent-import";

// Parsing never blocks the page: it can terminate this worker on cancel/timeout.
self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data;
    if (file.size > TALENT_FILE_BYTES) throw Error("Limite de 10 MB por arquivo.");
    const sheets: Record<string, string[][]> = Object.create(null);
    if (/\.csv$/i.test(file.name)) {
      sheets.CSV = readBulkCsv(await file.text());
      if (sheets.CSV.length > TALENT_FILE_ROWS + 1 || sheets.CSV.some(row => row.length > 51))
        throw Error("Use até 25.000 linhas de dados e 51 colunas.");
    } else if (/\.xlsx$/i.test(file.name)) {
      const workbook = XLSX.read(await file.arrayBuffer(), {type:"array",cellDates:true,sheetRows:TALENT_FILE_ROWS+2});
      if (workbook.SheetNames.length > 20) throw Error("Use um arquivo com até 20 abas ou salve a aba desejada como CSV.");
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) continue;
        const range = XLSX.utils.decode_range(sheet["!fullref"] ?? sheet["!ref"] ?? "A1");
        if (range.e.r > TALENT_FILE_ROWS || range.e.c > 50)
          throw Error("Uma aba excede 25.000 linhas de dados ou 51 colunas. Remova áreas extras ou exporte apenas a aba desejada.");
        if (Object.values(sheet).some(cell => cell && typeof cell === "object" && "f" in cell))
          throw Error("A planilha contém fórmulas. Salve uma cópia somente com os valores antes de importar.");
        sheets[name] = XLSX.utils.sheet_to_json<string[]>(sheet, {header:1,raw:false,defval:"",blankrows:true,dateNF:"yyyy-mm-dd"});
      }
    } else throw Error("Selecione CSV UTF-8 ou Excel .xlsx.");
    self.postMessage({sheets});
  } catch (error) {
    self.postMessage({error: error instanceof Error ? error.message : "Não foi possível ler a planilha."});
  }
};
