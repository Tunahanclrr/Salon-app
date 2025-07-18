const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false ,
        unique: true, // aynı e posta ile baska çalısan OLmaz!
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    gender:{
        type:String,
        require:true,
        enum:["Erkek","Kadın"]
    },
    role: {
        type: String,
        required: true,
        enum: ['manikür', 'cilt bakım uzmanı', "epilasyon uzmanı"]
    },
    // Randevular (Appointment modelinden referans alır)
    appointments: [{
      type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
   }],
   // Paket satışları (PackageSale modelinden referans alır)
   packageSales: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PackageSale'
   }]

}, { timestamps: true })

module.exports = mongoose.model('Employee', employeeSchema);
