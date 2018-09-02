import * as assert from 'assert';
import { test } from 'sarg';
import { randomBytes } from 'crypto';

const bo = require('../');

class User {
    id: number; // uint32
    name: string; // string
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}

class UserProcessor extends bo.CustomTypeProcessor<User> {
    encode(value: User) {
        const finalBuffer = Buffer.concat([
            Buffer.alloc(8),
            Buffer.from(value.name, 'utf8')
        ]);

        finalBuffer.writeUInt32LE(value.id, 0);
        finalBuffer.writeUInt32LE(finalBuffer.byteLength - 8, 4);

        return finalBuffer;
    }

    validate(user: any){
        return user instanceof User;
    }

    decode(buffer: Buffer): User {
        let offset: number = 0;

        const id: number = buffer.readUInt32LE(offset);
        offset += 4;

        const nameLength = buffer.readUInt32LE(offset);
        offset += 4;

        const name = buffer.slice(offset, offset + nameLength).toString('utf8');

        return new User(id, name);
    }
}

test('it should encode NaN numbers into null', function() {
    const buffer = new bo.ObjectEncoder().encode({
        object: { value: NaN }
    });
    assert.deepEqual(new bo.ObjectDecoder(buffer).decode(), {
        object: { value: null }
    })
});

test('it should encode complex object', function() {
    const buffer = new bo.ObjectEncoder().encode(require('./test.json'));
    assert.deepEqual(new bo.ObjectDecoder(buffer).decode(), require('./test.json'));
});

test('it should encode native boolean parameters', function() {
    const buffer = new bo.ObjectEncoder().encode({ wellTested: true, badTested: false });

    assert.deepEqual(new bo.ObjectDecoder(buffer).decode(), { wellTested: true, badTested: false });
});

test('it should encode undefined', function() {
    assert.deepEqual(new bo.ObjectDecoder(new bo.ObjectEncoder().encode({ undefinedValue: undefined })).decode(), {
        undefinedValue: undefined
    });
});

test('it should encode null value', function() {
    assert.deepEqual(new bo.ObjectDecoder(new bo.ObjectEncoder().encode({ id: null })).decode(), { id: null });
});

test('it should encode buffer value', function() {   
    const id = randomBytes(64);
    const decoded = new bo.ObjectDecoder(new bo.ObjectEncoder().encode({
        id
    })).decode();

    assert.deepEqual(decoded, { id });
});

test('it should encode date objects', function() {
    const date = new Date();

    assert.deepEqual(new bo.ObjectDecoder(new bo.ObjectEncoder().encode([{ createdAt: date }])).decode(), [{
        createdAt: date
    }]);
});

test('it should throw when receive an invalid instructions', function() {
    assert.throws(function() {
        new bo.ObjectEncoder(<any>{});
    });
});

test('it should encode objects with custom types', function() {
    const instructions = [{
        value: 80,
        processor: new UserProcessor
    }];
    const encoder = new bo.ObjectEncoder(instructions);
    const buffer = encoder.encode({
        users: [new User(1, 'victor'), new User(2, 'gallins')]
    });

    const decoded: { users: any[] } = new bo.ObjectDecoder(buffer, instructions).decode();

    decoded.users.map(user => assert.ok(user instanceof User, 'all results inside `users` property should be equal to `User` instance'));

    assert.deepEqual(decoded, {
        users: [new User(1, 'victor'), new User(2, 'gallins')]
    });
});

test('it should support special characters', function() {
    assert.deepEqual(new bo.ObjectDecoder(new bo.ObjectEncoder().encode({ name: 'Cristóvão Galvão' })).decode(), {
        name: 'Cristóvão Galvão'
    });

    assert.deepEqual(new bo.ObjectDecoder(new bo.ObjectEncoder().encode({ specialText: '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ' })).decode(), {
        specialText: '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ'
    });
});