import type { Payload } from 'payload'

/** Adds the first AI models and datasets when the catalog is still empty. */
export async function seedCatalogIfEmpty(payload: Payload) {
  try {
    const models = await payload.count({ collection: 'ai-models', overrideAccess: true })
    if (models.totalDocs === 0) {
      await payload.create({
        collection: 'ai-models',
        overrideAccess: true,
        data: {
          name: 'CA7',
          publisher: 'CA7',
          summary:
            'The CA7 data model: Qwen2.5 with a data-analyst system prompt, tuned to stay factual with tables, sensor readings, logs and camera events.',
          task: 'data-analysis',
          framework: 'ollama',
          baseModel: 'qwen2.5:7b',
          chatModel: 'ca7',
          version: 'v1.0',
          stage: 'production',
          license: 'Apache-2.0',
          tags: ['data', 'sensors', 'cameras', 'sql'],
          installCommand: 'bash ai/ca7/build.sh\nollama run ca7',
          modelCard:
            'CA7 is a prompt-tuned Qwen2.5 model, built with Ollama from ai/ca7/system.md.\n\nWhat it does\n- Looks at columns, types, units and time ranges before it concludes.\n- Never invents numbers and shows its calculation.\n- Writes SQL, Python and JSON that run as written.\n\nWhat it is not\nIt is not a newly trained model. To train on your own data, fine-tune Qwen and point the build script at the result.',
        } as never,
      })
      await payload.create({
        collection: 'ai-models',
        overrideAccess: true,
        data: {
          name: 'Qwen2.5 7B',
          publisher: 'Alibaba Qwen',
          summary: 'General purpose open model that CA7 is built on.',
          task: 'text-generation',
          framework: 'ollama',
          chatModel: 'qwen2.5:7b',
          version: '7b',
          stage: 'production',
          license: 'Apache-2.0',
          tags: ['base-model', 'llm'],
          installCommand: 'ollama pull qwen2.5:7b',
          downloadUrl: 'https://ollama.com/library/qwen2.5',
        } as never,
      })
    }

    const datasets = await payload.count({ collection: 'datasets', overrideAccess: true })
    if (datasets.totalDocs === 0) {
      await payload.create({
        collection: 'datasets',
        overrideAccess: true,
        data: {
          name: 'Sensor readings (example)',
          publisher: 'CA7',
          summary: 'Example structure for time series from temperature and humidity sensors.',
          source: 'sensors',
          format: 'csv',
          version: 'v1.0',
          license: 'CC0-1.0',
          tags: ['example', 'time-series'],
          schemaColumns: [
            { column: 'timestamp', type: 'datetime', description: 'UTC time of the reading' },
            { column: 'device_id', type: 'string', description: 'Sensor id' },
            { column: 'temperature_c', type: 'float', description: 'Degrees Celsius' },
            { column: 'humidity_pct', type: 'float', description: 'Relative humidity' },
          ],
        } as never,
      })
      await payload.create({
        collection: 'datasets',
        overrideAccess: true,
        data: {
          name: 'Camera events (example)',
          publisher: 'CA7',
          summary: 'Example structure for events detected by cameras and other devices.',
          source: 'cameras',
          format: 'jsonl',
          version: 'v1.0',
          license: 'CC0-1.0',
          tags: ['example', 'events'],
          schemaColumns: [
            { column: 'timestamp', type: 'datetime', description: 'UTC time of the event' },
            { column: 'camera_id', type: 'string', description: 'Camera id' },
            { column: 'event_type', type: 'string', description: 'motion, person or vehicle' },
            { column: 'confidence', type: 'float', description: 'Model confidence, 0 to 1' },
          ],
        } as never,
      })
    }
  } catch (err) {
    payload.logger.warn({ err }, 'Could not seed the AI models and datasets catalog')
  }
}
