import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    body: String,
});

export default UserSchema