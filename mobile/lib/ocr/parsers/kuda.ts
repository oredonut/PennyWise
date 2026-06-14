// TODO: tune for Kuda layout once real OCR fixtures are collected from the
// emulator debug screen.
// Known patterns: phrased as "You spent ₦X" or "You received ₦X", with the
// merchant named inline in the same sentence as the amount.
export { parseGeneric as parseKuda } from './generic'
