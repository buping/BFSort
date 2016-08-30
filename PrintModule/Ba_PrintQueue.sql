/*
Navicat SQL Server Data Transfer

Source Server         : localhost
Source Server Version : 105000
Source Host           : localhost:1433
Source Database       : IntelDatabase
Source Schema         : dbo

Target Server Type    : SQL Server
Target Server Version : 105000
File Encoding         : 65001

Date: 2016-08-24 13:12:12
*/


-- ----------------------------
-- Table structure for Ba_PrintQueue
-- ----------------------------
DROP TABLE [dbo].[Ba_PrintQueue]
GO
CREATE TABLE [dbo].[Ba_PrintQueue] (
[PrintQueueID] int NOT NULL IDENTITY(1,1) ,
[PrintQueueName] varchar(50) NULL ,
[OutPortCmd] varchar(20) NULL ,
[Direction] varchar(2) NULL DEFAULT ((0)) ,
[PrintFileName] varchar(20) NULL ,
[Count] int NULL DEFAULT ((0)) ,
[Weight] numeric(18,3) NULL DEFAULT ((0)) ,
[SerialNumber] varchar(20) NULL ,
[baggingBatchNumber] varchar(50) NULL ,
[mailBagNumbe] varchar(50) NULL ,
[sortingCode] varchar(50) NULL ,
[barcodeContent] varchar(50) NULL ,
[CountryCode] varchar(10) NULL ,
[ErrorMsg] varchar(500) NULL ,
[PrintFlag] varchar(10) NULL DEFAULT ((0)) ,
[CreateDate] datetime NULL DEFAULT (getdate()) 
)


GO
DBCC CHECKIDENT(N'[dbo].[Ba_PrintQueue]', RESEED, 3)
GO

-- ----------------------------
-- Indexes structure for table Ba_PrintQueue
-- ----------------------------
CREATE INDEX [PrintQueue_Index] ON [dbo].[Ba_PrintQueue]
([OutPortCmd] ASC, [Direction] ASC, [PrintFlag] ASC, [CreateDate] ASC) 
GO

-- ----------------------------
-- Primary Key structure for table Ba_PrintQueue
-- ----------------------------
ALTER TABLE [dbo].[Ba_PrintQueue] ADD PRIMARY KEY ([PrintQueueID])
GO
