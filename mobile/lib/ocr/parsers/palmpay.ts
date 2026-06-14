// TODO: tune for PalmPay layout once real OCR fixtures are collected from the
// emulator debug screen.
// Known patterns: "Debit/Credit Alert" header, a prominent amount, a "To:" or
// "From:" label followed by the name, and a DD/MM/YYYY date.
export { parseGeneric as parsePalmpay } from './generic'
