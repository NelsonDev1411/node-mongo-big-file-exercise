const Records = require('./records.model');
const fs = require('fs');
const csv = require('csv-parse');

const upload = async (req, res) => {
    const { file } = req;
    console.log(file)
    const { path, destination, filename } = file;
    const MAX_FILES = 2000
    let batch = []

    try {
        fs.createReadStream(path)
        .pipe(csv.parse({ columns: true, delimiter: ',' }))
        .on('data', async (row) => {
            batch.push(row);
            if (batch.length === MAX_FILES) {
                // insertamos los registros por lotes
                await Records.insertMany(batch);
                batch = [];
            }
        })
        .on('end', async () => {
            if (batch.length > 0) {
                await Records.insertMany(batch);
                batch = [];
            }
        })
        .on('error', (err) => {
            console.error('Error al leer el archivo:', err);
        })
        .on('close', async () => {
            try {
                console.log(file)
                await fs.unlink(`${destination}/${filename}`, (err) => {
                    if (err) {
                        console.error('Error al eliminar el archivo:', err);
                    } else {
                        console.log('Archivo eliminado exitosamente');
                    }
                });
            } catch (error) {
                console.error('Error al eliminar el archivo:', error);
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        
    }

    return res.status(200).json({ message: 'Files uploaded successfully' });
};

const list = async (_, res) => {
    try {
        const data = await Records
            .find({})
            .limit(10)
        
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json(err);
    }
};

module.exports = {
    upload,
    list,
};
