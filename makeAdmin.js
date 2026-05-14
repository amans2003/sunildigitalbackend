const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const email = 'admin@test.com';
        const userExists = await User.findOne({ email });

        if (userExists) {
            userExists.role = 'admin';
            await userExists.save();
            console.log('User promoted to Admin successfully');
        } else {
            await User.create({
                name: 'System Admin',
                email: email,
                password: 'admin123',
                role: 'admin'
            });
            console.log('Default Admin account created: admin@test.com / admin123');
        }
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
