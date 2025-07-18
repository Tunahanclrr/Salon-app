const Service = require('../models/Services');

// POST /api/services  – yeni hizmet
exports.createService = async (req,res)=>{
  try{
    const { name, duration, price } = req.body;
    if(!name || !duration || price === undefined || price === null) return res.status(400).json({message:'İsim, süre ve fiyat zorunlu'});
    const svc = await Service.create({ name, duration, price });
    res.status(201).json({ message:'Hizmet eklendi', data:svc });
  }catch(err){ 
    console.error('Create service error:', err);
    res.status(500).json({message:'Sunucu hatası', error: err.message}); 
  }
};

// GET /api/services – liste
exports.getServices = async (_req,res)=>{
  try{
    const list = await Service.find();
    res.json(list);
  }catch(err){ res.status(500).json({message:'Sunucu hatası'}); }
};

// DELETE /api/services/:id – hizmet silme
exports.deleteService = async (req,res)=>{
  try{
    const { id } = req.params;
    if(!id) return res.status(400).json({message:'ID gerekli'});
    const svc = await Service.findByIdAndDelete(id);
    if(!svc) return res.status(404).json({message:'Hizmet bulunamadı'});
    res.status(200).json({ message:'Hizmet silindi', data:svc });
  }catch(err){ 
    console.error('Delete service error:', err);
    res.status(500).json({message:'Sunucu hatası'}); 
  }
};

// PUT /api/services/:id – hizmet düzenleme
exports.editService = async (req,res)=>{
  try{
    const { id } = req.params;
    const { name, duration, price } = req.body;
    
    if(!id) return res.status(400).json({message:'ID gerekli'});
    if(!name || !duration || !price) return res.status(400).json({message:'İsim, süre ve fiyat zorunlu'});
    
    const updatedService = await Service.findByIdAndUpdate(
      id, 
      { name, duration, price },
      { new: true, runValidators: true }
    );
    
    if(!updatedService) return res.status(404).json({message:'Hizmet bulunamadı'});
    
    res.status(200).json({ message:'Hizmet güncellendi', data: updatedService });
  }catch(err){
    console.error('Edit service error:', err);
    res.status(500).json({message:'Sunucu hatası'});
  }
};