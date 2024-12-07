"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", () => {
    test("works", async () => {
      const job = await Job.create({
        companyHandle: "c1",
        title: "Frontend Developer",
        salary: 90000,
        equity: 0.08,
      });
  
      expect(job).toEqual({
        id: expect.any(Number),
        companyHandle: "c1",
        title: "Frontend Developer",
        salary: 90000,
        equity: "0.08",
      });
    });
  
    test("throws error if companyHandle not in database", async () => {
      await expect(
        Job.create({
          companyHandle: "invalid-handle",
          title: "Invalid Job",
          salary: 50000,
          equity: 0.05,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });


    /************************************** findAll */

  describe("findAll", () => {
    test("works", async () => {
      const jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
            id: expect.any(Number),
            companyHandle: 'c1',
            title: 'Backend Developer',
            salary: 80000,
            equity: '0.05'
          },
          {
            id: expect.any(Number),
            companyHandle: 'c2',
            title: 'Backend Developer',
            salary: 80000,
            equity: '0.05'
          },
          {
            id: expect.any(Number),
            companyHandle: 'c1',
            title: 'Software Engineer',
            salary: 100000,
            equity: '0.1'
          },
          {
            id: expect.any(Number),
            companyHandle: 'c1',
            title: 'Software Engineer',
            salary: 100000,
            equity: '0.1'
          }
        ]);
    });
  });
  

    /************************************** get */

  describe("get", () => {
    test("works", async () => {
      const job = await Job.findAll();
      const jobId = job[0].id;
  
      const fetchedJob = await Job.get(jobId);
      expect(fetchedJob).toEqual({
        id: jobId,
        companyHandle: "c1",
        title: "Backend Developer",
        salary: 80000,
        equity: "0.05",
      });
    });
  
    test("throws NotFoundError if job not found", async () => {
      await expect(Job.get(999999)).rejects.toThrow(NotFoundError);
    });
  });


     /************************************** filter */

  describe("filter", () => {
    test("filters jobs by title", async () => {
      const jobs = await Job.filter({ title: "backend" });
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "Backend Developer",
          salary: 80000,
          equity: "0.05",
        },
        {
          id: expect.any(Number),
          companyHandle: 'c2',
          title: 'Backend Developer',
          salary: 80000,
          equity: '0.05'
        }
      ]);
    });
  
    test("filters jobs by minSalary", async () => {
      const jobs = await Job.filter({ minSalary: 90000 });
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "Software Engineer",
          salary: 100000,
          equity: "0.1",
        },
        {
            id: expect.any(Number),
            companyHandle: 'c1',
            title: 'Software Engineer',
            salary: 100000,
            equity: '0.1'
          }
      ]);
    });
  
    test("throws error if minSalary is negative", async () => {
      await expect(Job.filter({ minSalary: -100 })).rejects.toThrow(BadRequestError);
    });
  
    test("throws NotFoundError if no jobs match", async () => {
      await expect(Job.filter({ title: "Nonexistent" })).rejects.toThrow(NotFoundError);
    });
  });
  

    /************************************** update */

  describe("update", () => {
    test("works", async () => {
      const jobs = await Job.findAll();
      const jobId = jobs[0].id;
  
      const updatedJob = await Job.update(jobId, { salary: 85000 });
      expect(updatedJob).toEqual({
        id: jobId,
        companyHandle: "c1",
        title: "Backend Developer",
        salary: 85000,
        equity: "0.05",
      });
    });
  
    test("throws NotFoundError if job not found", async () => {
      await expect(Job.update(999999, { salary: 85000 })).rejects.toThrow(NotFoundError);
    });
  
    test("throws BadRequestError if no data is provided", async () => {
      const jobs = await Job.findAll();
      const jobId = jobs[0].id;
  
      await expect(Job.update(jobId, {})).rejects.toThrow(BadRequestError);
    });
  });

  
      /************************************** remove */

      describe("remove", () => {
        test("works", async () => {
          const jobs = await Job.findAll();
          const jobId = jobs[0].id;
      
          const deletedJob = await Job.remove(jobId);
          expect(deletedJob).toEqual({
            "deleted" : jobId
          });
      
          const remainingJobs = await Job.findAll();
          expect(remainingJobs.length).toBe(3);
        });
      
        test("throws NotFoundError if job not found", async () => {
          await expect(Job.remove(999999)).rejects.toThrow(NotFoundError);
        });
      });
      