const Result = require("../response/appResult");
const uuid = require("uuid");

const {IUploadSingleImage} = require("../../utils/firebase/firebaseImageUploads");
const log_func = require("../../utils/logger");


// ------------------------------  Gives new name To Image & uploads them to firebase  ------------------
//---------: this accepts the general file from the request, which have imageCOver && images
const upload1ImageWithNewName= async (file, uid)=>{
    if(!uid){
        uid=uuid.v4()
    }
    if (!file ) {
        log_func("error", "no req files img")
        return Result.Failed("no image cover")
    }
    const img={}

  //``````````````-- after just the file have been found `````````````````````

    let names =file.originalname.split(".")
    const name =  names[0].trim();
    let type=names[names.length-1]


    let fName = `${uid}-${name}-${Date.now()}.${type}`;

    // log_func('info', "HAVE file")
    const result = await IUploadSingleImage(file.buffer, fName)
    // console.log("result", result)
    if (result.fail()) {
        return result
        // return new AppError("uploading error", 502)
    }
    // console.log("filename", req.file.filename)
    img.imageCover = result.value.name
    img.suffix = result.value.suffix
    img.imagePath = result.value.imagePath

    return Result.Ok(img)
}


const uploadImagesWithNewNames=async (files, uid)=>{
    const names=[]
    await Promise.all(
        files.map(async (file, i) => {
            // console.log("iterating ``````````", i,"---->", file)

            let name =file.originalname.split(".")
            let ext=name[name.length-1]


            const filename = `${uid}-${Date.now()}-${i + 1}.${ext}`;
            // console.log("******************fname````````...>",i, filename)

            const result= await  IUploadSingleImage(file.buffer,  filename)
            if (result.fail()){
                console.log("err=>",result.error)
                return Result.Failed("failed uploading multi images, in a loop")
            }

            names.push(result.value.name)
            console.log("bdy.img===", names)
        })
    );

    return Result.Ok(names)

}



// =========================  for uploading multiple images  -
const uploadNewImages=async (files) => {
    let img={}
    let uid=uuid.v4()

    if(!files){
        return Result.Failed("no image or images found")
    }
    const res= await upload1ImageWithNewName(files.imageCover[0], uid)
    if (res.fail()){
        return res
    }
    img=res.value
    img.id=uid
    //-------------------- multiple image
    if (files.images){
        const result=await uploadImagesWithNewNames(files.images, uid)
        if (res.fail()){
            return res
        }
        img.images=result.value
    }
    return Result.Ok(img)

}
// For Updating many Images with a name
const uploadImagesWIthGivenNames= async (files, fileNames)=>{
    if (files.length>0 && fileNames.length===files.length  ){
        let images=[]

        await Promise.all(
            files.map(async (file, i) => {
                const result= await  IUploadSingleImage(file.buffer,  fileNames[i])
                if (result.fail()){
                    console.log("err=>",result.error)
                    return result
                }
                images.push(result.value.name)
            })
        );
        return Result.Ok(images)

    }
}
//

exports.uploadNewImages=uploadNewImages

exports.upload1ImageWithNewName=upload1ImageWithNewName
exports.uploadImagesWithNewNames=uploadImagesWithNewNames
exports.uploadImagesWIthGivenNames=uploadImagesWIthGivenNames