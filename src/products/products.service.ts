import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Product } from './entities/product.entity';
import {validate as isUUID} from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }


  async create(createProductDto: CreateProductDto) {

    try {

      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }

  findAll(paginationDto:PaginationDto) {
    const {limit=10, offset=0} = paginationDto
    const products = this.productRepository.find({
      take: limit,
      skip: offset,

      // TODO: relations
    })
    return products;
  }

  async findOne(term: string) {
    let oneProduct: Product
    if(isUUID(term)){
      oneProduct = await this.productRepository.findOneBy({id:term})
    }else{
      const queryBuilder = this.productRepository.createQueryBuilder();
      oneProduct = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug',
        {
          title:term.toUpperCase(),
          slug:term.toLowerCase()
        }).getOne()
      
    }
    
    if(!oneProduct)
      throw new NotFoundException(`Product with term ${term} not found`)
    return oneProduct;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const deleteProduct = await this.findOne(id)
    await this.productRepository.remove(deleteProduct)
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    this.logger.error(error, error.detail)
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
