class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    //1a]FILTERING
    const queryObj = { ...this.queryString };
    queryObj.keyword?queryObj.name={$regex:queryObj.keyword, $options:'i'
  }:''
    const excludedFields = ['page', 'sort', 'limit', 'fields','keyword'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(queryObj);
    //1b]ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt}lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }
  sort() {
    //2]SORTING
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
     
      this.query = this.query.sort(sortBy);
      //Sorting multiple in mongoose= Sort("Price ratingsAverage")
    } else {
      //sorts the latest upload
      // this.query = this.query.sort(' price');
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    //3]FIELD LIMITING
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }
  paginate() {
    //4]PAGINATION
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * 10;
    //page 3&limit10,1-10,page1,11-20,page2,21-30 page3
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
