const express=require('express');
const app=express();
const mongoose = require('mongoose');
const ejsMate=require('ejs-mate');
const methodOverride=require('method-override');
const Campground=require('./models/campground');
const path=require('path');
//const Joi=require('joi');
const Review=require('./models/review');
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
const ExpressError=require('./utilis/ExpressError');
const catchAsync=require('./utilis/catchAsync');
const {campgroundSchema,reviewSchema}=require('./schemas.js');
    
mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewURLParser: true,
   // useCreateIndex:true,
    useUnifiedTopology: true
});

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
    console.log("database connected");
});
app.engine('ejs',ejsMate);
const validateCampground=(req,res,next)=>{
    // const campgroundSchema=joi.object({
    //         campground:joi.object({
    //             title:joi.string().required(),
    //             price:joi.number().required().min(0),
    //             image:joi.string().required(),
    //             location:joi.string().required(),
    //             description:joi.string().required()

    //         }).required()
    //     })
        const {error}=campgroundSchema.validate(req.body);
        if(error){
            const msg=error.details.map(el=>el.message).join(',')
            throw new ExpressError(msg,400)
        }
        else{
            next();
        }
        // console.log(result);
      
}
const validateReview=(req,res,next)=>{
    const {error}=reviewSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',')
        throw new ExpressError(msg,400)
    }
    else{
        next();
    }
}

app.get('/',(req,res)=>{
    // res.send('HELLO FROM YELP CAMP')
    res.render('home');
})
// app.get('/makecampground',async (req,res)=>{
//     const camp=new Campground({title:'My Backyard',description:'cheap camping!!'});
//     await camp.save();
//     res.send(camp)
// })
app.get('/campgrounds',catchAsync(async (req,res)=>{
    const campgrounds=await Campground.find({});
    res.render('campgrounds/index',{campgrounds})
 }))
 app.get('/campgrounds/new',(req,res)=>{
    res.render('campgrounds/new');
})
app.post('/campgrounds',validateCampground,catchAsync(async (req,res,next)=>{
   // res.send(req.body);
//    try{
   
// const campgroundSchema=joi.object({
//             campground:joi.object({
//                 title:joi.string().required(),
//                 price:joi.number().required().min(0),
//                 image:joi.string().required(),
//                 location:joi.string().required(),
//                 description:joi.string().required()

//             }).required()
//         })
//         const {error}=campgroundSchema.validate(req.body);
//         if(error){
//             const msg=error.details.map(el=>el.message).join(',')
//             throw new ExpressError(msg,400)
//         }
//         console.log(result);
   const campground=new Campground(req.body.campground);
   await campground.save();
   res.redirect(`/campgrounds/${campground._id}`)
//    }catch(e){
//        naxt(e);
//    }
}))
 app.get('/campgrounds/:id',catchAsync(async(req,res)=>{
    const campground=await Campground.findById(req.params.id).populate('reviews');
    //console.log(campground);
    res.render('campgrounds/show',{campground});
    // res.render('campgrounds/show');
}));
app.get('/campgrounds/:id/edit',catchAsync(async(req,res)=>{
    const campground=await Campground.findById(req.params.id)
    res.render('campgrounds/edit',{campground});
}));
app.put('/campgrounds/:id',validateCampground,catchAsync(async(req,res)=>{
    // res.send("IT WORKED!!");
    const {id}=req.params;
    const campground=await Campground.findByIdAndUpdate(id,{...req.body.campground})
    res.redirect(`/campgrounds/${campground._id}`)
}));
app.delete('/campgrounds/:id',catchAsync(async(req,res)=>{
    const {id}=req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))
app.post('/campgrounds/:id/reviews',validateReview,catchAsync(async(req,res)=>{
    // res.send('you made it!!')
   const campground =await Campground.findById(req.params.id);
   const review=new Review(req.body.review);
   campground.reviews.push(review);
   await review.save();
   await campground.save();
   res.redirect(`/campgrounds/${campground._id}`);
}))
app.delete('/campgrounds/:id/reviews/:reviewId',catchAsync(async(req,res)=>{
    const {id,reviewId}=req.params;
    await Campground.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
    //res.send("Delete Me!!");
}))
app.all('*',(req,res,next)=>{
    // res.send("404!!!");
    next(new ExpressError('Page Not Found',404))
})
app.use((err,req,res,next)=>{
    const {statusCode=500,message='Something went wrong'}=err;
    // const {statusCode=500}=err;
    if(!err.message) err.message='oh No,Something went wrong!!'
    res.status(statusCode).render('error',{err});
    res.send('Oh,something went wrong');
})
app.listen(3000,()=>{
    console.log('Serving on port 3000')
})
