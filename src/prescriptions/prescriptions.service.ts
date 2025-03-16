import { Injectable } from '@nestjs/common';

@Injectable()
export class PrescriptionsService {
  private prescriptions: any[] = [];

  create(prescription: any) {
    this.prescriptions.push(prescription);
    return prescription;
  }

  findAll() {
    return this.prescriptions;
  }
}
