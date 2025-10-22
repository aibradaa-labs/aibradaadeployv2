// AI POD: mock provider
export async function mockProvider(task) {
  return { ok: true, data: `Mocked ${task}` };
}
