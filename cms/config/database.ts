import path from 'path';

export default ({ env }: { env: (key: string, defaultValue?: any) => any }) => ({
  connection: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
    },
    useNullAsDefault: true,
  },
});
