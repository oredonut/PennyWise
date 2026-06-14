// TODO: tune for OPay layout once real OCR fixtures are collected from the
// emulator debug screen.
// Known patterns: shows "Wallet Debit/Credit", a large ₦ amount, the
// beneficiary name below the amount, and the date at the bottom of the card.
export { parseGeneric as parseOpay } from './generic'
