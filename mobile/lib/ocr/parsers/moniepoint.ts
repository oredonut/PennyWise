// TODO: tune for Moniepoint layout once real OCR fixtures are collected from the
// emulator debug screen.
// Known patterns: similar to the GTBank SMS layout rendered in-app — "DR/CR"
// labels with an account-centric display rather than a merchant-centric one.
export { parseGeneric as parseMoniepoint } from './generic'
