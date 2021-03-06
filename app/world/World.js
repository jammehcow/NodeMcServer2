var fs = require('fs');
var utils = require('../utils.js');
var zlib = require('zlib');

/**
 * A minecraft world represented in my own format
 * 
 * World format:
 * 
 */

class World {
    /**
     * Loads a world
     * 
     * @param {string} filename 
     */
    constructor(path) {
        this.path = "./" + path;
        const fileExists = fs.existsSync(path);
        const isDirectory = fs.lstatSync(path).isDirectory();
        if(isDirectory) {
            this.loadWorld();
        } else {
            console.log("Unable to load world!");
        }
    }

    getChunkPosition(x, z) {

    }

    getChunkPacket(x, z, fullChunk) {
        const fullPacket = utils.createBufferObject();
        utils.writeInt(x, fullPacket);
        utils.writeInt(z, fullPacket);
        utils.writeByte(1, fullPacket);
        utils.writeVarInt(0x1, fullPacket);
        // Heightmaps
        utils.writeHeightmap(fullPacket);
        // Chunk data
        this.getChunkData(x, z, fullPacket);
        // Block Entities
        utils.writeVarInt(0, fullPacket);

        return fullPacket;
    }

    getChunkData(x, z, fullPacket) {
        const data = utils.createBufferObject();
        // Chunk sections
        utils.writeVarInt(1, data);
        utils.appendData(data, this.getChunkSection(x, 0, z));
        //utils.appendData(data, this.getChunkSection(x, 1, z));
        //utils.appendData(data, this.getChunkSection(x, 2, z));
        //utils.appendData(data, this.getChunkSection(x, 3, z));
        //utils.appendData(data, this.getChunkSection(x, 4, z));
        //utils.appendData(data, this.getChunkSection(x, 5, z));
        //utils.appendData(data, this.getChunkSection(x, 6, z));
        //utils.appendData(data, this.getChunkSection(x, 7, z));
        //utils.appendData(data, this.getChunkSection(x, 8, z));
        //utils.appendData(data, this.getChunkSection(x, 9, z));
        //utils.appendData(data, this.getChunkSection(x, 10, z));
        //utils.appendData(data, this.getChunkSection(x, 11, z));
        //utils.appendData(data, this.getChunkSection(x, 12, z));
        //utils.appendData(data, this.getChunkSection(x, 13, z));
        //utils.appendData(data, this.getChunkSection(x, 14, z));
        //utils.appendData(data, this.getChunkSection(x, 15, z));
        // Biomes
        for(let i = 0; i < 256; i++) {
            utils.writeInt(0, data);
        }
        // Write length in bytes
        utils.writeVarInt(data.b.length, fullPacket);
        // Write data structures
        utils.appendData(fullPacket, data.b);
    }

    getChunkSection(x, y, z, palette) {
        const chunkSection = utils.createBufferObject();
        // Block Count
        utils.writeUShort(16*16*16, chunkSection);
        // This cannot be any more than 32
        const bitsPerBlock = 4;
        utils.writeByte(bitsPerBlock, chunkSection);
        // Palette
        utils.writeVarInt(1, chunkSection);
        utils.writeVarInt(1, chunkSection);
        // Data Array
        const longs = [];
        let longLow = 0;
        let longHigh = 0;
        for(let yCurrent = 0; yCurrent < 16; yCurrent++) {
            for(let zCurrent = 0; zCurrent < 16; zCurrent++) {
                for(let xCurrent = 0; xCurrent < 16; xCurrent++) {
                    // Testing block state
                    const blockStateID = 0;
                    const blockIndex = (((yCurrent * 16) + zCurrent) * 16) + xCurrent;
                    const longOffset = (blockIndex * bitsPerBlock) % 64;
                    if(longOffset < 64 && longOffset + bitsPerBlock - 1 >= 64) {
                        longHigh |= (blockStateID << longOffset) & 0xFFFFFF;
                        const temp = Buffer.alloc(8);
                        temp.writeInt32BE(longHigh);
                        temp.writeInt32BE(longLow, 4);
                        longs.push(temp);
                        longLow = longHigh = 0;
                        longLow |= blockStateID >> (64 - longOffset);
                    } else if(longOffset < 32 && longOffset + bitsPerBlock - 1 >= 32) {
                        longLow |= (blockStateID << longOffset) & 0xFFFFFF;
                        longHigh |= blockStateID >> (32 - longOffset - 1);
                    } else if(longOffset < 32) {
                        longLow |= blockStateID << longOffset;
                    } else {
                        longHigh |= blockStateID << longOffset;
                    }
                    if(64 - longOffset == bitsPerBlock) {
                        const temp = Buffer.alloc(8);
                        temp.writeInt32BE(longHigh);
                        temp.writeInt32BE(longLow, 4);
                        longs.push(temp);
                        longLow = longHigh = 0;
                    }
                }
            }
        }
        utils.writeVarInt(longs.length, chunkSection);
        utils.writeByteArray(Buffer.concat(longs), chunkSection);
        return chunkSection.b;    
    }


    loadWorld() {
        const levelFile = fs.readFileSync(this.path + "/level.dat");
        const levelRaw = zlib.gunzipSync(levelFile);
        const levelNbt = utils.readNBT(levelRaw);
    }

}

module.exports = World;