export function extractId(key: string): string | undefined {
  return key.split('/').pop();
}
