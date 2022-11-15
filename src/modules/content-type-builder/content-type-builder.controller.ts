import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { SuccessResponseDto } from '@moonlightjs/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContentTypeBuilderService } from './content-type-builder.service';

@ApiTags('content-type-builder')
@Controller({
  path: 'content-type-builder',
  version: '1',
})
export class ContentTypeBuilderController {
  constructor(
    private readonly contentTypeBuilderService: ContentTypeBuilderService,
  ) {}

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Post()
  create(@Body() createContentTypeBuilderInput: CreateContentTypeBuilderInput) {
    return this.contentTypeBuilderService.create(createContentTypeBuilderInput);
  }
}
