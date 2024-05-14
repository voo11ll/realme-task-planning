// import { CardService } from './card/card.service';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // const cardService = app.get(CardService);
  // await cardService.deactivateExpiredCards();

  await app.close();
}

bootstrap();
