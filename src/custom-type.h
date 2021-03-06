#include <stdint.h>
#include <v8.h>

#ifndef CUSTOM_TYPE_H_
#define CUSTOM_TYPE_H_

using namespace v8;

namespace CustomType {
    uint8_t Validate(Local<Object> processor, Local<Value> value);
    uint8_t Encode(Local<Object> processor, Local<Value> value, uint8_t** result, size_t* byte_length);
    Local<Value> Decode(size_t byte_length, uint8_t* input_buffer, Local<Object> processor);
}

#endif